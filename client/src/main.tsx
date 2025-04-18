import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import App from "./App";
import "./index.css";

// Import fonts
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/nunito";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </ThemeProvider>
);
