import { defineConfig } from 'astro/config';
import { site } from './src/data/site';

// https://docs.astro.build
export default defineConfig({
  // Canonical/OG URLs need an absolute origin. Empty until the client confirms the domain.
  site: site.url || undefined,
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'am'],
    routing: { prefixDefaultLocale: false },
  },
  image: {
    // Sharp is Astro's default service; AVIF/WebP are requested per <Picture>.
    responsiveStyles: false,
  },
  prefetch: false,
  devToolbar: { enabled: false },
  vite: {
    build: {
      // three.js is code-split behind a dynamic import; it is expected to be large.
      chunkSizeWarningLimit: 800,
    },
  },
});
