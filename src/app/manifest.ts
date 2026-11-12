import type { MetadataRoute } from "next";
import { withBase } from "@/lib/paths";

// Lets Android (and other browsers) use the gold flower when the site is added to the home screen.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Al-Zahra Islamic Library",
    short_name: "Al-Zahra Library",
    description: "The book catalog of the Al-Zahra Islamic Library at the Islamic Education Center of Houston.",
    start_url: withBase("/"),
    display: "standalone",
    background_color: "#04142e",
    theme_color: "#04142e",
    icons: [
      { src: withBase("/brand/icon-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBase("/brand/icon-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
