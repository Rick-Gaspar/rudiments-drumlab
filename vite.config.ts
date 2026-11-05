// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        // Registration happens only in src/lib/pwa/register-sw.ts (guarded wrapper).
        injectRegister: null,
        filename: "sw.js",
        // Manifest lives in public/manifest.webmanifest.
        manifest: false,
        devOptions: { enabled: false },
        workbox: {
          globPatterns: ["client/**/*.{js,css,png,ico,webmanifest}"],
          // Files are emitted under dist/client but served from the site root.
          modifyURLPrefix: { "client/": "/" },
          // Never let the SW handle OAuth callbacks.
          navigateFallbackDenylist: [/^\/~oauth/],
          runtimeCaching: [
            {
              // Navigations: network first, cached shell as fallback (offline support).
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "rl-pages",
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
              },
            },
            {
              // Google Fonts stylesheets + font files (open-licensed, safe to cache).
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "rl-fonts-css" },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "rl-fonts",
                expiration: { maxEntries: 32, maxAgeSeconds: 365 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),
    ],
  },
});
