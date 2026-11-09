// Old address: the Browse page now lives at /browse/.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";

export const metadata: Metadata = { title: "Browse", robots: { index: false } };

export default function OldCategoriesPage() {
  return <Redirect to="/browse/" />;
}
