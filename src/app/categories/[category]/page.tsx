// Old address: a category page now opens its shelf on the Explore page.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";
import { exploreHref, categories } from "@/lib/catalog";

type Props = { params: Promise<{ category: string }> };

export const metadata: Metadata = { title: "Explore", robots: { index: false } };
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export default async function OldCategoryPage({ params }: Props) {
  return <Redirect to={exploreHref((await params).category)} />;
}
