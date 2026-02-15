import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.bstatic.com', // 👈 พระเอกของเรา (รูปจาก Booking)
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // 👈 เผื่อรูป Placeholder ที่เราใช้
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // 👈 เผื่อรูปกันเหนียว
      },
    ],
  },
};

export default nextConfig;
