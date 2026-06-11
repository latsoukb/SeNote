import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

const isNative =
  typeof window !== "undefined" &&
  Boolean(window.Capacitor?.isNativePlatform?.());

// ResizeObserver errors from Radix UI are benign — suppress them
const roErr = /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/;
window.addEventListener("error", (e) => {
  if (roErr.test(e.message)) {
    e.stopImmediatePropagation();
    return;
  }
  if (isNative) {
    console.error("[SeNote APK] Erreur non interceptée", e.message, e.error);
  }
});
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason?.message && roErr.test(e.reason.message)) {
    e.preventDefault();
    return;
  }
  if (isNative) {
    console.error("[SeNote APK] Rejet non géré", e.reason);
    e.preventDefault();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Pas de retry sur APK : les requêtes réseau peuvent bloquer et consommer de la RAM
      retry: isNative ? 0 : 3,
    },
  },
});

const tree = (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
// StrictMode désactivé sur APK : évite le double-mount des canvas lourds
root.render(isNative ? tree : <React.StrictMode>{tree}</React.StrictMode>);
