import type { NextConfig } from 'next';

/**
 * Remote images (worker / client avatars, company logos, certificates) are served
 * by the ASP.NET backend from its /Images folder. We allow any host so the app keeps
 * working when NEXT_PUBLIC_SERVER_BASE points at a LAN IP, a tunnel, or production.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
