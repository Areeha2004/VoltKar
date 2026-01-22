/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "via.placeholder.com",  
      'images.pexels.com',
    ],
  },
  allowedDevOrigins: [
    'dbb86e7a-b733-4d6b-a2cd-b47581fb4a4c-00-kx8zueekccdn.sisko.replit.dev',
    '*.replit.dev',
    '127.0.0.1',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
