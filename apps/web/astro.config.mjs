import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import AstroPWA from "@vite-pwa/astro";

// Base path configurable (PUBLIC_BASE_PATH). Raíz por defecto; p. ej. "/sismicaid".
const rawBase = process.env.PUBLIC_BASE_PATH || "/";
const base = rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
// scope/start_url de la PWA con barra final ("/" o "/sismicaid/").
const scope = base.endsWith("/") ? base : `${base}/`;

// https://astro.build/config
export default defineConfig({
  base,
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
        start_url: scope,
        scope,
        display: "standalone",
        background_color: "#070A0F",
        theme_color: "#070A0F",
        // Rutas relativas: resuelven contra la URL del manifest, así sirven en
        // raíz y bajo subpath sin cambios.
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precachea el shell de la app (todas las rutas son HTML estáticos).
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: scope,
        navigateFallbackDenylist: [/\/api\//],
        runtimeCaching: [
          {
            // Datos de la API (mismo origen): red primero, cae a caché.
            // El SW solo intercepta dentro de su scope, así que "/api/" basta.
            urlPattern: ({ url }) => url.pathname.includes("/api/"),
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
