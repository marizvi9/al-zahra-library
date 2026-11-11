// Old address: /categories/fiqh/worship/ is now /explore/fiqh/worship/.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";
import { categories } from "@/lib/catalog";

type Props = { params: Promise<{ category: string; sub: string }> };

export const metadata: Metadata = { title: "Explore", robots: { index: false } };
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.flatMap((c) => c.subCategories.map((s) => ({ category: c.slug, sub: s.slug })));
}

export default async function OldSubCategoryPage({ params }: Props) {
  const p = await params;
  return <Redirect to={`/explore/${p.category}/${p.sub}/`} />;
}
