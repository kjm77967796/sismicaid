import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    AstroPWA({
      registerType: "autoUpdate",
      // Registro e inyección del manifest los hacemos manualmente en Base.astro
      // (la auto-inyección de @vite-pwa/astro no aplica de forma fiable en Astro).
      injectRegister: null,
      manifest: {
        name: "Sismicaid",
        short_name: "Sismicaid",
        description: "Información sísmica, tsunami, recursos y reportes para Venezuela.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#070A0F",
        theme_color: "#070A0F",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precachea el shell de la app (todas las rutas son HTML estáticos).
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Datos de la API (mismo origen en prod): red primero, cae a caché.
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
