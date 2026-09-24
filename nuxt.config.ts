// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: "app/",
  ssr: false,
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: { port: 4331 },

  app: {
    head: {
      title: "Klikpajak",
      htmlAttrs: { lang: "id" },
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  // SPA with hashed chunks: always revalidate the HTML shell so a redeploy never
  // leaves a tab pointing at chunk hashes that no longer exist.
  routeRules: {
    "/_nuxt/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
    "/**": { headers: { "cache-control": "no-cache" } },
  },

  css: [
    // pixel.css is the Panda root — PostCSS injects all generated Pixel CSS here.
    // app.css comes after so shell overrides land after the Panda layers.
    "@/assets/css/pixel.css",
    "@/assets/css/app.css",
  ],
  postcss: {
    plugins: {
      "@mekari/pixel3-postcss": {},
    },
  },
  vite: {
    // Pre-bundle Pixel so Vite never re-optimizes mid-session (that swaps Pixel's
    // module identity and breaks popover/tooltip directives).
    optimizeDeps: {
      include: ["@mekari/pixel3"],
    },
  },
});
