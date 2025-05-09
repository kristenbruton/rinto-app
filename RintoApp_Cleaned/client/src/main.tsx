import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { loadStripe } from "@stripe/stripe-js";

// Pre-load Stripe to avoid performance issues
if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
} else {
  console.warn('Stripe public key missing. Payment features will be unavailable.');
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="waverentals-theme">
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </ThemeProvider>
);
