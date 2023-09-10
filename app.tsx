/// <reference lib="dom" />

import React, { Suspense, useEffect } from "react";
import { Button } from "./dax";
import { withSocket } from "./dynamicBuild/socket";
import { Toaster } from 'sonner'
import { toast } from "./wrapToast";

const Daa = () => {
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
    withSocket();
  }, []);

  return (
    <div>
      <Suspense fallback={<>Waitttt</>}>
        {/* @ts-ignore -- whatever */}
        <Button2 onClick={() => toast('Clicked', { description: 'Lazy Button' })} />
      </Suspense>
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
