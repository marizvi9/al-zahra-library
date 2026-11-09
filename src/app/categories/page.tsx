// Old address: the Explore page now lives at /explore/.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";

export const metadata: Metadata = { title: "Explore", robots: { index: false } };

export default function OldCategoriesPage() {
  return <Redirect to="/explore/" />;
}
