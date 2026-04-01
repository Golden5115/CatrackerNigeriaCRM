import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Keep any other config options you already have here */
  
  serverActions: {
    bodySizeLimit: '10mb', 
  },
};

export default nextConfig;