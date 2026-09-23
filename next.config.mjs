/** @type {import('next').NextConfig} */

/**
 * Security headers.
 *
 * `SECURITY.md` previously claimed a strict CSP was in place; none was set.
 * These are the real ones.
 *
 * The CSP allows 'unsafe-inline' for styles because Tailwind and Next inject
 * inline style attributes, and for scripts because the theme/direction
 * bootstrap in layout.tsx must run inline before first paint. `data:` is
 * allowed for images because payment receipts are currently stored and
 * rendered as base64 data URIs — when receipts move to a streamed, access
 * controlled endpoint, drop `data:` from img-src.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  // Stops a browser second-guessing a declared type — the other half of the
  // receipt-upload defence alongside server-side magic-byte sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    serverActions: {
      // Receipts are sent as base64, which inflates a 5 MB image to ~6.7 MB.
      // The default 1 MB limit silently rejected any real photo.
      bodySizeLimit: "8mb",
    },
  },

  images: {
    remotePatterns: [
      // Demo imagery only. Before launch this should be narrowed to the
      // restaurant's own asset host.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
