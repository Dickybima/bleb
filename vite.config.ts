import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Link previews (Telegram, X, …) need absolute image URLs. VITE_SITE_URL wins; on Vercel the production domain is used.
  const siteUrl = (
    env.VITE_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "")
  ).replace(/\/$/, "");
  const apiKey = env.ZORA_API_KEY || env.VITE_ZORA_API_KEY;
  return {
    plugins: [
      react(),
      tailwindcss(),
      { name: "site-url", transformIndexHtml: (html: string) => html.replaceAll("%SITE_URL%", siteUrl) },
    ],
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
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
