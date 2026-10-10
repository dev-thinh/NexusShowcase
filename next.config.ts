import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/api/auth/signin',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
