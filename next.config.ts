import type { NextConfig } from 'next';
import path from 'node:path';

// El cuaderno (index.html + js/css/assets) se copia a public/ antes de compilar (tools/copy-notebook.mjs) y se
// sirve tal cual: sigue siendo el mismo que abre con doble clic en file://. Next suma la cuenta y la API.
const notebookCsp = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "font-src 'self' data:", "media-src 'self' data: blob:", "connect-src 'self'", "worker-src 'self'", "manifest-src 'self'",
  "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"
].join('; ');
const isDev = process.env.NODE_ENV === 'development';
const appCsp = [
  "default-src 'self'", `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`, "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:", "font-src 'self' data:", "connect-src 'self'", "worker-src 'self'", "manifest-src 'self'",
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"
].join('; ');
const common = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: path.resolve(__dirname) },
  async rewrites() {
    return { beforeFiles: [{ source: '/', destination: '/index.html' }], afterFiles: [], fallback: [] };
  },
  async headers() {
    return [
      { source: '/:path*', headers: [...common, { key: 'Content-Security-Policy', value: appCsp }] },
      { source: '/', headers: [{ key: 'Content-Security-Policy', value: notebookCsp }, { key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/index.html', headers: [{ key: 'Content-Security-Policy', value: notebookCsp }, { key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }, { key: 'Service-Worker-Allowed', value: '/' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] }
    ];
  }
};

export default nextConfig;
