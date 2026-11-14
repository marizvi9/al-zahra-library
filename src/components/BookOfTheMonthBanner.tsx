// Home page: the Book of the Month, above Featured books. The whole card links to its own page.
import Link from "next/link";
import { bookOfTheMonth as b } from "@/lib/bookOfTheMonth";
import { withBase } from "@/lib/paths";

export default function BookOfTheMonthBanner() {
  return (
    <section className="botm" aria-labelledby="botm-heading">
      <header className="botm-head">
        <h2 id="botm-heading" className="botm-heading">
          <Ornament side="left" />
          <span>Book of the Month</span>
          <Ornament side="right" />
        </h2>
        <p className="botm-month">{b.month}</p>
      </header>
      <Link href="/book-of-the-month/" className="botm-card">
        <img className="botm-cover" src={withBase(b.cover.src)} alt={`Cover of ${b.title}`} width={b.cover.width} height={b.cover.height} />
        <span className="botm-text">
          <span id="botm-title" className="botm-title">
            {b.title}
          </span>
          <span className="botm-author">{b.author}</span>
          <span className="botm-blurb">{b.description[0]}</span>
          <span className="botm-more">Find out more →</span>
        </span>
      </Link>
    </section>
  );
}

/** A gold rule ending in a small diamond, either side of the heading. */
function Ornament({ side }: { side: "left" | "right" }) {
  const diamond = (
    <svg className="botm-diamond" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
      <path d="M7 1 L13 7 L7 13 L1 7 Z" fill="currentColor" />
    </svg>
  );
  return (
    <span className="botm-orn" aria-hidden="true">
      {side === "right" && diamond}
      <span className="botm-orn-line" />
      {side === "left" && diamond}
    </span>
  );
}
