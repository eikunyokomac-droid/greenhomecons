import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig(async () => {
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          main: "./worker/index.ts",
          name: "greenhome-consult",
          compatibility_date: "2026-09-06",
          keep_vars: true,
        },
      }),
    ],
  };
});
