import vinext from "vinext";
import { defineConfig } from "vite";

const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

if (!databaseId) {
  throw new Error(
    "CLOUDFLARE_D1_DATABASE_ID must be set for a Cloudflare Workers build.",
  );
}

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
          d1_databases: [
            {
              binding: "DB",
              database_name: "greenhome-consult",
              database_id: databaseId,
            },
          ],
        },
      }),
    ],
  };
});
