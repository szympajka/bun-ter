import React, { Suspense, useEffect } from "react";
import { Button } from "./dax";
import { withSocket } from "./dynamicBuild/socket";

const Daa = () => {
  const Button2 = React.lazy(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      default: Button,
    }
  });

  useEffect(() => {
    console.log('mounted');
  }, []);

  useEffect(() => {
    withSocket();
  }, []);

  return (
    <div>
      <Suspense fallback={<>Waitttt</>}>
        {/* @ts-ignore -- whatever */}
        <Button2 onClick={() => console.log('clicked')} />
      </Suspense>
    </div>
  );
}

export const App = () => {
  return (
    <React.StrictMode>
      <h1>Hello, world</h1>
      <Button onClick={() => console.log('clicked')} />
      <Daa />
    </React.StrictMode>
  );
}
