import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@workspace/ui/globals.css"
import "./index.css"
import { App } from "./App.tsx"
import { ThemeProvider } from "@workspace/ui/components/theme-provider"
import { LanguageProvider } from "@/lib/language"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
)
