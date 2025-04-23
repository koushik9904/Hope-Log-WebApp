import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";

// Import fonts
import "@fontsource-variable/plus-jakarta-sans"; // Default font
import "@fontsource-variable/nunito"; // Default font
import "@fontsource-variable/montserrat"; // Replacing Acorn font
import "@fontsource-variable/inter"; // Replacing TT Commons font

console.log("Starting application rendering...");

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  
  console.log("Root element found, rendering application");
  
  createRoot(rootElement).render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
  
  console.log("Application rendered successfully");
} catch (error) {
  console.error("Error rendering application:", error);
}
