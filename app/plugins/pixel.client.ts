import { PixelPlugin, type PixelPluginConfig, usePixelTheme } from "@mekari/pixel3";

export default defineNuxtPlugin((nuxtApp) => {
  // Token mode 2.4 ("next" theme). Set BEFORE PixelPlugin installs its theme
  // watcher so the first render already carries data-panda-theme="next" — no
  // flash of 2.1 colours. Klikpajak uses the default Mekari product theme
  // (empty string), not "enterprise".
  const { setNextTheme, setDarkMode, setProductTheme } = usePixelTheme();
  setNextTheme(true);
  setDarkMode(false);
  setProductTheme("");

  nuxtApp.vueApp.use(PixelPlugin, {
    pixelTheme: true,
    // Mounted explicitly via <MpToastManager /> in the layout — two managers
    // make toast.notify() silently no-op.
    toastManager: false,
    tooltipDirective: true,
  } as PixelPluginConfig);
});
