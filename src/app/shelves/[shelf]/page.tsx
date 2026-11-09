// Old address: /shelves/300/ is now /explore/300/.
import type { Metadata } from "next";
import Redirect from "@/components/Redirect";
import { shelves } from "@/lib/catalog";

type Props = { params: Promise<{ shelf: string }> };

export const metadata: Metadata = { title: "Explore", robots: { index: false } };
export const dynamicParams = false;
export function generateStaticParams() {
  return shelves.map((s) => ({ shelf: s.slug }));
}

export default async function OldShelfPage({ params }: Props) {
  return <Redirect to={`/explore/${(await params).shelf}/`} />;
}
