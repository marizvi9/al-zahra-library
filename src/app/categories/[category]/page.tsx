// Old address: a category page now opens its shelf on the Browse page.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";
import { browseHref, categories } from "@/lib/catalog";

type Props = { params: Promise<{ category: string }> };

export const metadata: Metadata = { title: "Browse", robots: { index: false } };
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export default async function OldCategoryPage({ params }: Props) {
  return <Redirect to={browseHref((await params).category)} />;
}
