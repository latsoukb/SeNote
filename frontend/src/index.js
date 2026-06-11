import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// Radix Slider/Popover déclenche parfois cette erreur bénigne en dev — ne pas bloquer l'UI
const roErr = /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/;
window.addEventListener("error", (e) => {
  if (roErr.test(e.message)) e.stopImmediatePropagation();
});
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason?.message && roErr.test(e.reason.message)) e.preventDefault();
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      console.error("Erreur non gérée (APK)", e.reason);
      e.preventDefault();
    }
  } catch {
    /* ignore */
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
