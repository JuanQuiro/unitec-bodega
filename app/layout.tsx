import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import 'styles/main.css';
import RegisterSW from '@/components/RegisterSW';

const inter = Inter({ display: 'swap', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mi Bodega - Pedidos por WhatsApp',
  description: 'Sistema de pedidos para bodegas de barrio',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  appleWebApp: {
    capable: true,
    title: 'Mi Bodega',
    statusBarStyle: 'default',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} min-h-screen bg-gray-50 antialiased`}>
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
