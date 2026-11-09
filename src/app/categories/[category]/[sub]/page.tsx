// Old address: a sub-category page now opens its section of the shelf on the Explore page.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";
import { exploreHref, categories } from "@/lib/catalog";

type Props = { params: Promise<{ category: string; sub: string }> };

export const metadata: Metadata = { title: "Explore", robots: { index: false } };
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.flatMap((c) => c.subCategories.map((s) => ({ category: c.slug, sub: s.slug })));
}

export default async function OldSubCategoryPage({ params }: Props) {
  const p = await params;
  return <Redirect to={exploreHref(p.category, p.sub)} />;
}
