import React from 'react';
import { App } from './app';

export const AppServer = async () => {
  console.log(Bun.inspect({ hello: 'time-in' }));
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log(Bun.inspect({ hello: 'time-out' }));

  return (
    <App />
  );
};