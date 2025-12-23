// Path: next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Replaced 'domains' with 'remotePatterns' (The modern Next.js standard)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mcdodo.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
};

export default nextConfig;