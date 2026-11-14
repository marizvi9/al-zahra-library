import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "FAQ", description: "Frequently asked questions about the Al-Zahra Islamic Library." };

export default function FaqPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <header className="page-head arch-band">
        <h1>FAQ</h1>
        <p className="lede">Coming soon!</p>
      </header>
    </div>
  );
}
