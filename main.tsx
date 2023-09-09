import React, { Suspense } from 'react';

const socket = new WebSocket('ws://localhost:3000');

socket.addEventListener('open', function (event) {
  socket.send('Hello Server!');
});

socket.addEventListener('message', function (event) {
  console.log('Message from server ', event.data);
});

const Button = ({ onClick }: { onClick: () => void }) => {
  return <button onClick={onClick}>Click me</button>;
}

const Daa = () => {
  const Button2 = React.lazy(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      default: Button,
    }
  });

  const Texts = React.lazy(async () => {
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      default: ({ text }: { text: React.ReactNode}) => <pre>{text}</pre>
    }
  });

  return (
    <div>
      <Suspense fallback={<>Waitttt</>}>
        <Button2 onClick={() => console.log('clicked')} />
      </Suspense>
      <Suspense fallback={<>Waitttt - sfsg</>}>
        <Texts text="ddsgdg sdg sg" />
      </Suspense>
    </div>
  );
}

export const App = async () => {
  // console.log(Bun.inspect({ hello: 'time-in' }));
  // await new Promise(resolve => setTimeout(resolve, 1000));
  // console.log(Bun.inspect({ hello: 'time-out' }));

  return (
    <React.StrictMode>
      <h1>Hello, world</h1>
      <Button onClick={() => console.log('clicked')} />
      <Daa />
    </React.StrictMode>
  );
};