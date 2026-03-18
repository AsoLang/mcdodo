// Path: next.config.ts

import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Control referrer information
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not needed by this site
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
  },
  // Force HTTPS for 1 year
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // Content Security Policy
  // unsafe-inline is required for Next.js hydration scripts
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      "connect-src 'self' https://api.stripe.com https://ipapi.co https://vitals.vercel-insights.com https://challenges.cloudflare.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mcdodo.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      // Vercel Blob Storage - Specific hostname
      {
        protocol: 'https',
        hostname: '8hgugo9qdwj5aya6.public.blob.vercel-storage.com',
      },
      // Vercel Blob Storage - Wildcard (future-proof for any Vercel Blob subdomain)
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      // Squarespace CDN (legacy images from old site)
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
      },
    ],
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Redirect old Squarespace URLs
  async redirects() {
    return [
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/warranty',
        destination: '/',
        permanent: true,
      },
      {
        source: '/70sale',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/terms-conditions',
        destination: '/terms',
        permanent: true,
      },
      {
        source: '/faq',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;