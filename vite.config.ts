/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { CSP } from './src/csp';

/** Sostituisce il segnaposto <!--csp--> di index.html con il meta tag della CSP, solo nella build:
 * in sviluppo Vite e React Refresh usano script inline che la CSP bloccherebbe. */
function cspMeta(): Plugin {
  let isBuild = false;
  return {
    name: 'csp-meta',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    transformIndexHtml(html) {
      const meta = isBuild ? `<meta http-equiv="Content-Security-Policy" content="${CSP}" />` : '';
      return html.replace('<!--csp-->', meta);
    },
  };
}

export default defineConfig({
  base: '/pac-vs-fp/',
  plugins: [react(), cspMeta()],
  build: {
    // niente asset in linea come data: per gli script; i font restano file separati
    assetsInlineLimit: 0,
  },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
  },
});
