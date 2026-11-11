import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Brake Oil Filling — Anomaly Monitor',
  description: 'ระบบตรวจจับความผิดปกติ Brake Oil Filling (LSTM Autoencoder)',
};

// ฟอนต์ใช้ system-ui ตาม mockup (รองรับภาษาไทยจากฟอนต์ของระบบ) — กำหนดไว้ที่ --font-sans ใน globals.css
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" data-theme="dark" className="font-sans">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
