import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./lib/wagmi";
import "./lib/zora";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles.css";

// After a redeploy, an open tab may request JS chunks that no longer exist; reload once to pick up the new build.
window.addEventListener("vite:preloadError", (event) => {
  const key = "launchpad:reloaded-for-chunk";
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  event.preventDefault();
  window.location.reload();
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

const rkTheme = {
  lightMode: lightTheme({ accentColor: "#111111", borderRadius: "large" }),
  darkMode: darkTheme({ accentColor: "#f2f2f0", accentColorForeground: "#0b0b0c", borderRadius: "large" }),
};

(window as { __launchpadMounted?: boolean }).__launchpadMounted = true;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} locale="en-US" modalSize="wide" appInfo={{ appName: "FOZO" }}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
