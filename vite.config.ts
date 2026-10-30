import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.ZORA_API_KEY || env.VITE_ZORA_API_KEY;
  return {
    plugins: [react()],
    server: {
      // Mirrors the /api/zora route during `npm run dev`, so the browser never calls Zora directly.
      proxy: {
        "/api/zora": {
          target: "https://api-sdk.zora.engineering",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/zora/, ""),
          headers: apiKey ? { "api-key": apiKey } : {},
          configure: (proxy) => proxy.on("proxyRes", (res) => { res.headers["x-launchpad-proxy"] = "1"; }),
        },
      },
    },
  };
});
