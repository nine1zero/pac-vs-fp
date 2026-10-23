import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/onest/latin-400.css';
import '@fontsource/onest/latin-500.css';
import '@fontsource/onest/latin-600.css';
import '@fontsource/onest/latin-700.css';
import './styles/base.css';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root mancante');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
