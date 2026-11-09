// Old address: Shelves is now part of the Explore page at /explore/.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";

export const metadata: Metadata = { title: "Explore", robots: { index: false } };

export default function OldShelvesPage() {
  return <Redirect to="/explore/" />;
}
