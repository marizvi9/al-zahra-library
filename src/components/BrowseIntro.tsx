// The one short "how to use this page" note at the top of every Browse page.
export default function BrowseIntro() {
  return (
    <header className="browse-intro">
      <h1>Browse</h1>
      <p className="lede">
        Every book has a call number like <strong>300&nbsp;·&nbsp;50</strong>. The first number is the
        shelf, and each shelf holds one subject. Pick a shelf below, then use the section buttons or the
        filter to narrow it down.
      </p>
    </header>
  );
}
