import { renderToReadableStream } from 'react-dom/server';
import { AppServer } from './main';
import path from 'node:path';
import { Server } from 'bun';

const tailwindOutput = Bun.file('./dist/output.css');

const buildsMatchers = new Map<string, () => Response>();

const excludeFromAutoMount = [
  '/assets/reactMain.js',
];

const init = async () => {
  const builds = await Bun.build({
    entrypoints: ['./dynamicBuild/b.tsx', './dynamicBuild/reactMain.tsx'],
    target: "browser",
    splitting: true,
    outdir: "./temp/build",
    minify: {
      identifiers: true,
      syntax: true,
      whitespace: true,
    },
  });

  for (const build of builds.outputs) {
    const relativePath = path.join('/assets', path.relative('./temp/build', build.path));

    buildsMatchers.set(relativePath, () => new Response(build.stream(), {
      headers: {
        "Content-Type": build.type,
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

const serveDemoPage = async (req: Request, bunServer: Server) => {
  const { pathname } = new URL(req.url);

  console.log(pathname);

  if (pathname === "/assets/tailwind/output.css" && req.method === "GET") {
    return new Response(tailwindOutput.stream(), {
      headers: {
        "Content-Type": tailwindOutput.type,
      },
    })
  };

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

        bunServer.publish("bridge", "Stream complete");
      };
    };

    const renderReact = async (req: Request, bunServer: Server) => {
      const AppComponent = await AppServer(req, bunServer);
      const stream = await renderToReadableStream(AppComponent, {
        bootstrapModules: ['/assets/reactMain.js'],
      });


      return stream;
    }

    const renderReactStream = await renderReact(req, server);

    const [, copyRenderReactStream] = renderReactStream.tee();

    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
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
        <link rel="stylesheet" href="/assets/tailwind/output.css">
        <script>
          function $U(h, s) {
            document.getElementById(h)?.remove();
            document.getElementById(h.replace('ST', 'SR'))?.remove();
          }
        </script>
        ${
          Array.from(buildsMatchers.keys()).filter((build) => !excludeFromAutoMount.includes(build)).map((build) => {
            if (build.endsWith('.js')) {
              return `<script type="module" src="${build}"></script>`
            }

            if (build.endsWith('.css')) {
              return `<link rel="stylesheet" href="${build}">`
            }

            return '';
          }).join('')
        }
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

          writer.write(new TextEncoder().encode('</div>'));

          tryCloseStream();
          break;
        }

        writer.write(value);
      }
    }

    writer.write(new TextEncoder().encode('<div id="root">'));

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

  if (pathname === "/ws") {
    const success = bunServer.upgrade(req);

    if (!success) {
      return new Response(JSON.stringify({ status: 400, message: "Bad request" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    return undefined;
  }
};

const serveHealthCheck = (req: Request) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/health") {
    return new Response(JSON.stringify({ status: 200, message: "OK" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
}

init();

export const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(req, server) {
    const healthCheckRequest = serveHealthCheck(req);

    if (healthCheckRequest) {
      return healthCheckRequest;
    }

    const websocketRequest = serveWebsocket(req, server);

    if (websocketRequest) {
      return websocketRequest;
    }

    const buildFileRequest = serverBuildFile(req);

    if (buildFileRequest) {
      return buildFileRequest;
    }

    const faviconRequest = serveFavicon(req);

    if (faviconRequest) {
      return faviconRequest;
    }

    const demoPageRequest = await serveDemoPage(req, server);

    if (demoPageRequest) {
      return demoPageRequest;
    }

    return new Response(JSON.stringify({ status: 404, message: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  },
  websocket: {
    open(ws) {
      ws.ping();
      ws.subscribe("bridge");

      server.publish("bridge", "A client connected!");
    },
    message(ws, message) {
      if (typeof message === "string") {
        server.publish("bridge", "A client says: " + decodeURIComponent(message));
      } else {
        server.publish("bridge", "A client says: " + decodeURIComponent(new TextDecoder().decode(message)));
      }
    },
    close(ws) {
      server.publish("bridge", "A client disconnected!");
    }
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
