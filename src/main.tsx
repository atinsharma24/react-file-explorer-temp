/**
 * ============================================================================
 * main.tsx — Application Entry Point
 * ============================================================================
 *
 * Bootstraps the React 18 application using `createRoot` (concurrent mode).
 * Imports the global stylesheet which includes Tailwind CSS directives.
 *
 * ============================================================================
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
