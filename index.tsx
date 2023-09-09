import { renderToReadableStream } from 'react-dom/server';
import { App } from './main';
import { Server } from 'bun';

const buildsMatchers = new Map<string, () => Response>();

const init = async () => {
  const builds = await Bun.build({
    entrypoints: ['./dynamicBuild/b.ts'],
    target: "browser",
    splitting: true,
    minify: {
      identifiers: true,
      syntax: true,
      whitespace: true,
    }
  });

  for (const build of builds.outputs) {
    buildsMatchers.set(build.path.substring(1), () => new Response(build.stream(), {
      headers: {
        "Content-Type": "application/javascript",
      },
    }));
  }
}

const serverBuildFile = (req: Request) => {
  const { pathname } = new URL(req.url);

  const buildFileRequest = buildsMatchers.get(pathname);

  if (buildFileRequest) {
    return buildFileRequest();
  }
}

const serveFavicon = (req: Request) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/favicon.ico" && req.method === "GET") {
    const svgSprite = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path fill="whitesmoke" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
      </svg>
    `;

    return new Response(svgSprite, {
      headers: {
        "Content-Type": "image/svg+xml",
      }
    });
  }
}

const serveDemoPage = async (req: Request) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/demo" && req.method === "GET") {
    let doneReact = false;
    let doneLocal = false;

    const tryCloseStream = () => {
      if (doneReact && doneLocal)  {
        writer.write(new TextEncoder().encode(`
            </body>
          </html>
        `));

        console.log("Stream complete");

        writer.close();
      };
    };

    const renderReact = async (request: Request) => {
      const AppComponent = await App();
      const stream = await renderToReadableStream(AppComponent);

      return stream;
    }

    const renderReactStream = await renderReact(req);

    const [, copyRenderReactStream] = renderReactStream.tee();

    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        try {
          console.log(new TextDecoder().decode(chunk));
        } catch (e) {
          writer.write(new TextEncoder().encode(`<pre style="color: red;">Error: ${e}</pre>`));
          console.log('error', e);
        }

        controller.enqueue(chunk);
      },
    });

    const writer = writable.getWriter();

    writer.write(new TextEncoder().encode(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <script>
          function $U(h, s) {
            document.getElementById(h)?.remove();
            document.getElementById(h.replace('ST', 'SR'))?.remove();
          }
        </script>
      </head>
      <body>
    `));

    async function writeToStreamAsync() {
      const iterations = 30;

      for (let i = 0; i <= iterations; i++) {
        await new Promise((resolve) => setTimeout(resolve, Math.round(Math.random() * 100)));

        let content = `<div id="ST-${i}">Iteration ${i}</div>`

        if (i > 0) {
          content += `<script id="SR-${i}">$U("ST-${i - 1}","ST-${i}")</script>`
        }

        if (i === iterations) {
          content += `<script id="SR-${i}">$U("SR-${i}","SR-${i}")</script>`
        }

        writer.write(new TextEncoder().encode(content));
      }

      doneLocal = true;
      tryCloseStream();
    }

    writeToStreamAsync();

    const reader = copyRenderReactStream.getReader();

    const proxyReactStream = async () => {
      let finish = false;

      while (!finish) {
        const { done, value } = await reader.read();

        if (done) {
          finish = true;
          doneReact = true;

          tryCloseStream();
          break;
        }

        writer.write(value);
      }
    }

    proxyReactStream();

    return new Response(readable, {
      headers: {
        'content-type': 'text/html',
      },
    });
  }
};

const serveWebsocket = (req: Request, bunServer: Server) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/ws" && req.method === "GET") {
    const success = bunServer.upgrade(req);

    if (!success) {
      return Response.json({ status: 400, message: "Bad request" }, { status: 400 });
    }

    return undefined;
  }
};

init();

export const server = Bun.serve<{ authToken: string }>({
  port: 3000,
  async fetch(req, server) {
    const buildFileRequest = serverBuildFile(req);

    if (buildFileRequest) {
      return buildFileRequest;
    }

    const faviconRequest = serveFavicon(req);

    if (faviconRequest) {
      return faviconRequest;
    }

    const demoPageRequest = await serveDemoPage(req);

    if (demoPageRequest) {
      return demoPageRequest;
    }

    const websocketRequest = serveWebsocket(req, server);

    if (websocketRequest) {
      return websocketRequest;
    }

    return Response.json({ status: 404, message: "Not found" }, { status: 404 });
  },
  websocket: {
    open(ws) {
      ws.ping();
      console.log("A client connected!");
    },
    message(ws, message) {
      console.log(`Received ${message}`);
      ws.send(`You said: ${message}`);
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);