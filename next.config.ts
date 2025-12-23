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
};

export default nextConfig;