import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cqlehguqpnoicldlriof.supabase.co',
        pathname: '/storage/v1/object/**',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default nextConfig;
