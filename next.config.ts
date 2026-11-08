import type { NextConfig } from "next";

// "export" turns the site into plain HTML/CSS/JS files in the `out/` folder,
// so it can later be hosted anywhere (no server or database needed).
// On GitHub Pages the site is served from /al-zahra-library, set by the
// NEXT_PUBLIC_BASE_PATH variable in the deploy workflow. Locally it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
