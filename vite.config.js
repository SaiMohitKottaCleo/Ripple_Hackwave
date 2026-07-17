import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiKey = env.ANTHROPIC_API_KEY || "";
  const groqKey = env.GROQ_API_KEY || "";
  const hasKey = Boolean(apiKey || groqKey);
  const preferred = String(env.VITE_AI_PROVIDER || "auto").toLowerCase();
  let aiProvider = "baked";
  if (preferred === "anthropic" && apiKey) aiProvider = "anthropic";
  else if (preferred === "groq" && groqKey) aiProvider = "groq";
  else if (apiKey) aiProvider = "anthropic";
  else if (groqKey) aiProvider = "groq";

  return {
    plugins: [react()],
    server: {
      port: 5173,
      // Dev-only proxy so the browser never sees the API key.
      // In production, you must host a real backend that does the same thing
      // (see README → "Production deployment").
      proxy: {
        "/api/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/anthropic/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (apiKey) proxyReq.setHeader("x-api-key", apiKey);
              proxyReq.setHeader("anthropic-version", "2023-06-01");
              proxyReq.setHeader("content-type", "application/json");
            });
          },
        },
	 "/api/groq": {
          target: "https://api.groq.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api\/groq/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              if (groqKey) proxyReq.setHeader("Authorization", `Bearer ${groqKey}`);
              proxyReq.setHeader("content-type", "application/json");
            });
          },
        },
      },
    },
    define: {
      __HAS_ANTHROPIC_KEY__: JSON.stringify(Boolean(hasKey)),
      __HAS_AI_KEY__: JSON.stringify(Boolean(hasKey)),
      __AI_PROVIDER__: JSON.stringify(aiProvider),
    },
  };
});
