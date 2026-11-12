// The short note at the top of every Shelves page: two plain sentences.
export default function ShelvesIntro() {
  return (
    <header className="explore-intro">
      <h1>Shelves</h1>
      <p className="shelves-blurb">
        Each shelf has a number and holds one subject. A call number like <strong>300&nbsp;·&nbsp;50</strong> means shelf 300,
        section 50, as written on the book&rsquo;s spine.
      </p>
    </header>
  );
}
