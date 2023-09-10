import React from 'react';
import { App } from './app';
import { Server } from 'bun';

const randomNumber = () => Math.round(Math.random() * 1000);

const sleep = async (ms: number = 100) => await new Promise(resolve => setTimeout(resolve, ms));

const asyncJob = async (server: Server) => {
  console.log('Async job started');
  await sleep(randomNumber());

  console.log('Async job message 1');
  server.publish("bridge", "Async Server Job message 1");

  await sleep(randomNumber());

  console.log('Async job message 2');
  server.publish("bridge", "Async Server Job message 2");

  await sleep(randomNumber());

  console.log('Async job message 3');
  server.publish("bridge", "Finish async job");
}

export const AppServer = async (req: Request, server: Server) => {
  await new Promise(resolve => setTimeout(resolve, 100));

  asyncJob(server);

  return (
    <App />
  );
};