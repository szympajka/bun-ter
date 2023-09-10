/// <reference lib="dom" />

import React, { Suspense, useEffect } from "react";
import { Button } from "./dax";
import { Toaster } from 'sonner'
import { toast } from "./wrapToast";

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
    const socket = new WebSocket('ws://localhost:3000/ws');

    socketRef.current = socket;

    const errorHandle = (event: Event) => {
      console.log('Error', event);
    }

    const messageHandle = (event: MessageEvent) => {
      console.log('Message from server ', event.data);

      toast('Server push message', { description: event.data});
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

    if (socketRef.current) {
      socketRef.current.send(formData.get('message') as string);
    }
  }

  return (
    <div>
      <Suspense fallback={<>Waitttt</>}>
        {/* @ts-ignore -- whatever */}
        <Button2 onClick={() => toast('Clicked', { description: 'Lazy Button' })} />
      </Suspense>

      <hr />
      <form noValidate onSubmit={onSubmit}>
        <input type="text" name="message" />
        <button type="submit">Submit</button>
      </form>
      <hr />
    </div>
  );
}

export const App = () => {
  return (
    <React.StrictMode>
      <h1>Hello, world</h1>
      <Button onClick={() => toast('Clicked', { description: 'Button' })} />
      <Daa />
      <Toaster position="bottom-center" visibleToasts={3} closeButton duration={999999} />
    </React.StrictMode>
  );
}
