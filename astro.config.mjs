// @ts-check
import netlify from "@astrojs/netlify";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import AutoImport from "unplugin-auto-import/vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const useHttps = process.env.ASTRO_DEV_HTTP !== "true";

/** @type {import('astro/config').AstroUserConfig} */
export default defineConfig({
    output: "server",
    adapter: netlify(),
    integrations: [vue({ appEntrypoint: "/src/lib/storyblok-app.ts" })],
    vite: {
        plugins: [
            tailwindcss(),
            AutoImport({
                imports: ["vue"],
                dts: "src/auto-imports.d.ts",
            }),
        ],
        resolve: {
            alias: {
                "@config": `${root}/config`,
                "~": `${root}/src`,
            },
        },
        optimizeDeps: {
            include: ["@storyblok/vue", "markdown-it"],
        },
    },
    server: {
        port: 3000,
        ...(useHttps
            ? {
                  https: {
                      key: readFileSync(`${root}/certs/localhost-key.pem`),
                      cert: readFileSync(`${root}/certs/localhost.pem`),
                  },
              }
            : {}),
    },
});
