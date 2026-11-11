import Link from "next/link";
import { FlowerMark } from "./Emblem";
import ExploreMenu from "./ExploreMenu";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          {/* The gold flower from the emblem (src/components/Emblem.tsx). */}
          <FlowerMark className="brand-logo" />
          <span className="brand-name">
            Al-Zahra <span className="brand-name-rest">Islamic Library</span>
          </span>
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
