// Path: next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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