import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Legacy payment flow → Modern Stripe flow
      {
        source: '/confirm-payment',
        destination: '/nfc/payment',
        permanent: true,
      },
      {
        source: '/checkout',
        destination: '/nfc/checkout',
        permanent: true,
      },
      {
        source: '/payment',
        destination: '/nfc/payment',
        permanent: true,
      },
      {
        source: '/preview',
        destination: '/nfc/configure',
        permanent: true,
      },
      {
        source: '/thank-you',
        destination: '/nfc/success',
        permanent: true,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
