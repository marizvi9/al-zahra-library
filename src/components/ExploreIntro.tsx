// The note at the top of every Explore page, split into its two topics:
// how to use this page (left / first on phones), and how the shelves and call numbers work (right).
export default function ExploreIntro() {
  return (
    <header className="explore-intro">
      <h1>Explore</h1>
      <div className="explore-guide">
        <section className="explore-guide-part" aria-labelledby="guide-use">
          <h2 id="guide-use">How to use this page</h2>
          <ul>
            <li>Pick a shelf from the tabs, or <strong>All shelves</strong> to see everything.</li>
            <li>On a shelf, its books are listed section by section.</li>
            <li>Narrow it down with the section buttons or the filter.</li>
          </ul>
        </section>
        <section className="explore-guide-part" aria-labelledby="guide-shelved">
          <h2 id="guide-shelved">How books are shelved</h2>
          <ul>
            <li>Each shelf has a number and holds one subject.</li>
            <li>
              A call number like <strong>300&nbsp;·&nbsp;50</strong> means shelf <strong>300</strong>,
              section <strong>50</strong>.
            </li>
            <li>The number on each card and tab matches the start of the call number on the book&rsquo;s spine.</li>
          </ul>
        </section>
      </div>
    </header>
  );
}
