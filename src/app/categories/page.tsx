// Old address: the categories now live on the Explore page (/explore/).
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";

export const metadata: Metadata = { title: "Explore", robots: { index: false } };

export default function OldCategoriesPage() {
  return <Redirect to="/explore/" />;
}
