import Link from "next/link";
import Girih from "./Girih";
import FooterLogo from "./FooterLogo";
import { AddressLink, IecLink } from "./LibraryLinks";
import { HoursList } from "./VisitInfo";
import { CONTACT_EMAIL } from "@/lib/library";

// Library-style footer: the logo, then three short columns of practical links (as library
// websites have), then the name line.
export default function Footer() {
  return (
    <footer className="site-footer">
      <Girih className="girih-footer" />
      <div className="container footer-inner">
        <div className="footer-top">
          {/* The logo sits straight on the navy footer (no plate) and links home. */}
          <Link href="/" className="footer-logo" aria-label="Al-Zahra Islamic Library, back to the home page">
            <FooterLogo />
          </Link>
          <nav className="footer-cols" aria-label="Footer">
            <div className="footer-col">
              <h2 className="footer-col-title">Visit</h2>
              <p>
                <AddressLink />
              </p>
              <HoursList className="footer-hours" />
              <p>
                <Link href="/visit/">How to find a book</Link>
              </p>
            </div>
            <div className="footer-col">
              <h2 className="footer-col-title">Catalogue</h2>
              <ul>
                <li><Link href="/search/">Search</Link></li>
                <li><Link href="/explore/">Browse by subject</Link></li>
                <li><Link href="/authors/">Authors A–Z</Link></li>
                <li><Link href="/shelves/">Shelves</Link></li>
                <li><Link href="/sets/">Multi-volume sets</Link></li>
                <li><Link href="/book-of-the-month/">Book of the Month</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h2 className="footer-col-title">Help</h2>
              <ul>
                <li><Link href="/faq/">FAQ</Link></li>
                <li><Link href="/contact/">Contact us</Link></li>
                <li><a href={`mailto:${CONTACT_EMAIL}`} className="break-anywhere">{CONTACT_EMAIL}</a></li>
                <li><Link href="/authors/photo-credits/">Photo credits</Link></li>
              </ul>
            </div>
          </nav>
        </div>
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
