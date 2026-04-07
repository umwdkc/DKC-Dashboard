// Copyright DKC UMW, All rights reserved

/**
 * Application entry point for the DKC Booking Dashboard.
 * 
 * This file initializes the React application and sets up:
 * - React Strict Mode for development warnings
 * - Theme provider for dark/light mode support
 * - Root component mounting
 * 
 * @module main
 */

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "./components/ui/theme-provider"

// Mount the React application to the DOM
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* ThemeProvider enables system-based theme detection and switching */}
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
    </ThemeProvider>
  </StrictMode>
)
