import type { NextConfig } from 'next';

/** backend ที่ /api/* ถูก proxy ไป (อ่านตอน start/build ฝั่ง server) — เครื่องอื่นใน tailnet ตั้งเป็น http://<tailscale-ip>:8001 */
const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
    ];
  },
};

export default nextConfig;
