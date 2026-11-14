// Home page: the Book of the Month, above Featured books. The whole card links to its own page.
import Link from "next/link";
import { bookOfTheMonth as b } from "@/lib/bookOfTheMonth";
import { withBase } from "@/lib/paths";

export default function BookOfTheMonthBanner() {
  return (
    <section className="botm" aria-labelledby="botm-title">
      <Link href="/book-of-the-month/" className="botm-card">
        <img className="botm-cover" src={withBase(b.cover.src)} alt={`Cover of ${b.title}`} width={b.cover.width} height={b.cover.height} />
        <span className="botm-text">
          <span className="botm-label">Book of the Month · {b.month}</span>
          <span id="botm-title" className="botm-title">
            {b.title}
          </span>
          <span className="botm-author">{b.author}</span>
          <span className="botm-blurb">{b.description[0]}</span>
          <span className="botm-note">Not in our library: read it free on {b.source}.</span>
          <span className="botm-more">Find out more →</span>
        </span>
      </Link>
    </section>
  );
}
