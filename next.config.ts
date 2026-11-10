import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Release 1 is a fully static site: no database, no API routes, no server
  // actions. Every route is prerendered at build time.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
