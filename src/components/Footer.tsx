import Link from "next/link";
import Girih from "./Girih";
import { withBase } from "@/lib/paths";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Girih className="girih-footer" />
      <div className="container footer-inner">
        {/* The emblem (a small copy of public/brand/emblem.png) sits on a parchment plate, because its lettering is navy. */}
        <Link href="/" className="footer-emblem" aria-label="Al-Zahra Islamic Library, back to the home page">
          <img src={withBase("/brand/emblem-footer.png")} alt="Al-Zahra Islamic Library emblem" width={140} height={116} loading="lazy" decoding="async" />
        </Link>
        {/* Two halves that each stay on one line, so on small screens the text wraps neatly at the dash. */}
        <p className="footer-name">
          <span>Al-Zahra Islamic Library -</span> <span>Islamic Education Center of Houston TX © 2026</span>
        </p>
      </div>
    </footer>
  );
}
