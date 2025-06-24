import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import GlobalErrorHandler from './components/utils/GlobalErrorHandler.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorHandler>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </GlobalErrorHandler>
  </StrictMode>
);