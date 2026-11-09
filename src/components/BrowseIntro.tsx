// The one short "how to use this page" note at the top of every Browse page.
// It combines the old Browse and Shelves descriptions and the combined page's how-to.
export default function BrowseIntro() {
  return (
    <header className="browse-intro">
      <h1>Browse</h1>
      <p className="lede">
        Books are shelved by number, and each shelf holds one subject. Every book has a call number like{" "}
        <strong>300&nbsp;·&nbsp;50</strong>: the first number is its shelf (it matches the number on each card
        and tab, and the start of the call number on the spine), and the second is its section. Pick a shelf
        to see everything on it, section by section, then use the section buttons or the filter to narrow it
        down.
      </p>
    </header>
  );
}
