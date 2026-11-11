import Link from "next/link";
import { FlowerMark } from "./Emblem";
import MainNav from "./MainNav";
import HeaderSearch from "./HeaderSearch";

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
          <MainNav />
        </nav>
      </div>
      <HeaderSearch />
    </header>
  );
}
