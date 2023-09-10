/// <reference lib="dom" />

import React, { Suspense, useEffect } from "react";
import { Toaster } from 'sonner'
import { toast } from "./wrapToast";
import { Input } from "./components/ui/input";
import { Button } from './components/ui/button';

import './app.styles.css';

const Daa = () => {
  const socketRef = React.useRef<WebSocket>();

  const Button2 = React.lazy(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      default: Button,
    }
  });

  useEffect(() => {
    let animationFrameId: number;

    const handleAnimationFrame = () => {
      toast('Mounted', { description: 'useEffect' });
    };

    animationFrameId = window.requestAnimationFrame(handleAnimationFrame);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const { hostname, protocol, port } = window.location;
    const url = new URL(`${protocol === 'https:' ? 'wss:' : 'ws:'}//${hostname}:${port}/ws`);

    const socket = new WebSocket(url);

    socketRef.current = socket;

    const errorHandle = (event: Event) => {
      console.log('Error', event);
    }

    const messageHandle = (event: MessageEvent) => {
      toast('WebSocket message received', { description: event.data});
    }

    socket.addEventListener('error', errorHandle);

    socket.addEventListener('message', messageHandle);

    return () => {
      socket.removeEventListener('error', errorHandle);
      socket.removeEventListener('message', messageHandle);

      socket.close();
    };
  }, []);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = formData.get('message');

      if (message) {
        socketRef.current.send(encodeURIComponent(message.toString()));
        e.currentTarget.reset();
        e.currentTarget.querySelector('input')?.focus();
      }
    } else {
      toast('WebSocket not connected, refresh.', { description: 'WebSocket' });
    }
  }

  return (
    <div className="app-container">
      <Suspense fallback={<>Waitttt</>}>
        {/* @ts-ignore -- whatever */}
        <Button2 variant='secondary' onClick={() => toast('Clicked', { description: 'Lazy Button' })} >Lazy button</Button2>
      </Suspense>

      <hr />
      <form noValidate onSubmit={onSubmit} className="form">
        <Input type="text" name="message" placeholder="Say hello!"/>
        <Button type="submit">Submit</Button>
      </form>
      <hr />
      <h3 className="header">Dynamically streamed content:</h3>
    </div>
  );
}

export const App = () => {
  return (
    <React.StrictMode>
      <h1 className="rootHeader">Hello, world</h1>
      <Button onClick={() => toast('Clicked', { description: 'Button' })} >Button</Button>
      <Daa />
      <Toaster position="bottom-center" visibleToasts={3} closeButton duration={999999} />
    </React.StrictMode>
  );
}
