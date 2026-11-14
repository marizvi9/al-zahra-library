import Link from "next/link";
import Girih from "./Girih";
import FooterLogo from "./FooterLogo";
import { IecLink } from "./LibraryLinks";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Girih className="girih-footer" />
      <div className="container footer-inner">
        {/* The logo sits straight on the navy footer (no plate) and links home. */}
        <Link href="/" className="footer-logo" aria-label="Al-Zahra Islamic Library, back to the home page">
          <FooterLogo />
        </Link>
        {/* Two halves that each stay on one line, so on small screens the text wraps neatly at the dash. */}
        <p className="footer-name">
          <span>Al-Zahra Islamic Library -</span> <span>
            <IecLink>Islamic Education Center of Houston TX</IecLink> © 2026
          </span>
        </p>
      </div>
    </footer>
  );
}
