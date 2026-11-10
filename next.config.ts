// import type { NextConfig } from 'next';

// /**
//  * Remote images (worker / client avatars, company logos, certificates) are served
//  * by the ASP.NET backend from its /Images folder. We allow any host so the app keeps
//  * working when NEXT_PUBLIC_SERVER_BASE points at a LAN IP, a tunnel, or production.
//  */
// const nextConfig: NextConfig = {
//   images: {
//     remotePatterns: [
//       { protocol: 'http', hostname: '**' },
//       { protocol: 'https', hostname: '**' },
//     ],
//   },
// };

// export default nextConfig;
import type { NextConfig } from 'next';

/**
 * Remote images (worker / client avatars, company logos, certificates) are served
 * by the ASP.NET backend from its /Images folder, so `next/image` only ever needs
 * to talk to that one host.
 *
 * The host is derived from NEXT_PUBLIC_SERVER_BASE instead of the previous
 * `hostname: '**'`, which turned the image optimiser into an open proxy for any
 * URL a caller passed in (`/_next/image?url=https://evil.example/...`). Pointing
 * NEXT_PUBLIC_SERVER_BASE at a LAN IP, a tunnel or production still works — the
 * allowlist just follows the base URL. localhost is kept so a dev build that
 * forgot to set the variable still renders local uploads.
 */
function backendImageHosts(): string[] {
  const hosts = new Set<string>(['localhost', '127.0.0.1']);
  const raw = process.env.NEXT_PUBLIC_SERVER_BASE;

  if (raw) {
    try {
      hosts.add(new URL(raw).hostname);
    } catch {
      /* not a parseable URL — keep the defaults rather than failing the build */
    }
  }

  return [...hosts];
}

const nextConfig: NextConfig = {
  images: {
    // A LAN/tunnel backend is usually plain http and production is https, so the
    // same host is allowed over both protocols; nothing else gets through.
    remotePatterns: backendImageHosts().flatMap((hostname) => [
      { protocol: 'http' as const, hostname },
      { protocol: 'https' as const, hostname },
    ]),
  },
};

export default nextConfig;
