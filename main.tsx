import React from 'react';
import { App } from './app';
import { Server } from 'bun';

export const AppServer = async (req: Request, server: Server) => {
  await new Promise(resolve => setTimeout(resolve, 100));

  return (
    <App />
  );
};