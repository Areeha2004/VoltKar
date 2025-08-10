/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",  // Google avatar host
      "via.placeholder.com",  
      'images.pexels.com',       // Your fallback host
    ],
    
  },
};

module.exports = nextConfig;
