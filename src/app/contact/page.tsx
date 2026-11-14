import type { Metadata } from "next";
import Breadcrumbs from "@/components/Breadcrumbs";
import { CONTACT_EMAIL } from "@/lib/library";

export const metadata: Metadata = { title: "Contact Us", description: "How to contact the Al-Zahra Islamic Library." };

export default function ContactPage() {
  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact Us" }]} />
      <header className="page-head arch-band">
        <h1>Contact Us</h1>
        <p className="lede">
          Have a question, comment or need help? Email us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </header>
    </div>
  );
}
