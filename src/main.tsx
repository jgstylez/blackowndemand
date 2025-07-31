import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import GlobalErrorHandler from "./components/utils/GlobalErrorHandler.tsx";
import { validateEnvironmentVariables } from "./utils/envValidation.ts";

// Validate environment variables before rendering
validateEnvironmentVariables();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GlobalErrorHandler>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </GlobalErrorHandler>
  </StrictMode>
);
