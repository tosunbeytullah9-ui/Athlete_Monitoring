import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@athleteiq/ui", "@athleteiq/db", "@athleteiq/validators"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;