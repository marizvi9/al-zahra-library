import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          {/*
            LOGO PLACEHOLDER — when you have the flower logo, put the file in
            /public (e.g. public/logo.svg) and replace this <span> with:
            <img src="/logo.svg" alt="" width={40} height={40} className="brand-logo" />
          */}
          <span className="brand-logo placeholder" aria-hidden="true" />
          <span className="brand-name">Al-Zahra Library</span>
        </Link>
        <nav aria-label="Main">
          <ul className="nav-list">
            <li>
              <Link href="/categories/">Browse</Link>
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
