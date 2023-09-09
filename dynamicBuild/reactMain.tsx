import { App } from "../app";
import { hydrateRoot } from 'react-dom/client';

// @ts-expect-error - looks like Bun TS issue
const domNode = document.getElementById('root');
hydrateRoot(domNode, <App />);