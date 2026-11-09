// Old address: Shelves is now part of the Browse page at /browse/.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";

export const metadata: Metadata = { title: "Browse", robots: { index: false } };

export default function OldShelvesPage() {
  return <Redirect to="/browse/" />;
}
