// Old address: /categories/fiqh/ is now /explore/fiqh/.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";
import { categories } from "@/lib/catalog";

type Props = { params: Promise<{ category: string }> };

export const metadata: Metadata = { title: "Explore", robots: { index: false } };
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export default async function OldCategoryPage({ params }: Props) {
  return <Redirect to={`/explore/${(await params).category}/`} />;
}
