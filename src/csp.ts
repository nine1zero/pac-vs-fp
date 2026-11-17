/** Content-Security-Policy della SPEC par. 1.1, inserita come meta tag nella build (vite.config.ts). */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' https://giscus.app",
  "style-src 'self' 'unsafe-inline' https://giscus.app",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://api.github.com https://giscus.app",
  "frame-src https://giscus.app",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');
