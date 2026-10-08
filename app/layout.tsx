import type { Metadata, Viewport } from 'next';
import './cuenta.css';

export const metadata: Metadata = {
  title: 'MI CUADERNO',
  description: 'Un lugarcito para mí.',
  referrer: 'no-referrer',
  icons: { icon: '/assets/icons/favicon.svg?v=56', apple: '/assets/icons/apple-touch-icon.png' },
  manifest: '/manifest.webmanifest'
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#6F8A6A' }; // color-ok: igual al theme-color de index.html

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <head>
        {/* Las mismas hojas del cuaderno: tokens, fuentes y componentes (DESIGN.md). */}
        <link rel="stylesheet" href="/css/fonts.css" />
        <link rel="stylesheet" href="/css/tokens.css" />
        <link rel="stylesheet" href="/css/base.css" />
        <link rel="stylesheet" href="/css/components.css" />
      </head>
      <body className="account">{children}</body>
    </html>
  );
}
