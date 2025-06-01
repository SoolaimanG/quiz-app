import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["vercel.com"],
    //remotePatterns: [new URL("https://vercel.com")],
    dangerouslyAllowSVG: true,
  },
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
