import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

const isNative =
  typeof window !== "undefined" &&
  Boolean(window.Capacitor?.isNativePlatform?.());

// Radix Slider/Popover déclenche parfois cette erreur bénigne en dev — ne pas bloquer l'UI
const roErr = /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/;
window.addEventListener("error", (e) => {
  if (roErr.test(e.message)) {
    e.stopImmediatePropagation();
    return;
  }
  if (isNative) {
    console.error("Erreur APK", e.message, e.error);
  }
});
window.addEventListener("unhandledrejection", (e) => {
  if (e.reason?.message && roErr.test(e.reason.message)) e.preventDefault();
  if (isNative) {
    console.error("Erreur non gérée (APK)", e.reason);
    e.preventDefault();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
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
// Pas de StrictMode sur APK : évite double-mount des effets lourds (PageSheet, canvas)
root.render(isNative ? tree : <React.StrictMode>{tree}</React.StrictMode>);
