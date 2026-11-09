// The notice shown just above the footer on every page (home, browse,
// search and every book page). It lives in the shared layout, so editing the
// wording here changes it everywhere. It used to be inside the footer.
export default function Disclaimer() {
  return (
    <aside className="disclaimer" aria-label="About this catalogue">
      <p className="container muted small">
        This catalogue lists the books the library holds. Please ask at the library about borrowing.
      </p>
    </aside>
  );
}
