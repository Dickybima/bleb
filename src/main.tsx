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
import "./index.css";
import { useTheme } from "./lib/theme";

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

// RainbowKit follows the site's light/dark toggle, with the hero's zinc palette.
const rkDark = darkTheme({ accentColor: "#fafafa", accentColorForeground: "#09090b", borderRadius: "large", overlayBlur: "small" });
rkDark.colors.modalBackground = "#18181b";
const rkLight = lightTheme({ accentColor: "#09090b", accentColorForeground: "#fafafa", borderRadius: "large", overlayBlur: "small" });
for (const t of [rkDark, rkLight]) t.fonts.body = "Inter, system-ui, sans-serif";

function ThemedRainbowKit({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <RainbowKitProvider theme={theme === "dark" ? rkDark : rkLight} locale="en-US" modalSize="wide" appInfo={{ appName: "ZEON" }}>
      {children}
    </RainbowKitProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemedRainbowKit>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </ThemedRainbowKit>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
