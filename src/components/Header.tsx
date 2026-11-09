import Link from "next/link";
import { withBase } from "@/lib/paths";
import ExploreMenu from "./ExploreMenu";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          {/* Logo file: public/logos/al-zahra-logo.svg — replace it with the real logo
              (same file name) and it updates here and in the welcome intro. */}
          <img src={withBase("/logos/al-zahra-logo.svg")} alt="" width={40} height={40} className="brand-logo" />
          <span className="brand-name">The Al-Zahra Library at IEC</span>
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            <li className="nav-dropdown">
              <ExploreMenu />
            </li>
            <li>
              <Link href="/search/">Search</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
