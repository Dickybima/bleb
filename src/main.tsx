import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./lib/wagmi";
import "./lib/zora";
import App from "./App";
import "@rainbow-me/rainbowkit/styles.css";
import "./styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
});

const rkTheme = {
  lightMode: lightTheme({ accentColor: "#111111", borderRadius: "large" }),
  darkMode: darkTheme({ accentColor: "#f2f2f0", accentColorForeground: "#0b0b0c", borderRadius: "large" }),
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} locale="id-ID" modalSize="wide" appInfo={{ appName: "Profile Launchpad" }}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
