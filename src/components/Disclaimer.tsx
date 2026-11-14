import { AddressLink } from "./LibraryLinks";

// The notice shown just above the footer on every page (home, explore,
// search and every book page). It lives in the shared layout, so editing the
// wording here changes it everywhere. It used to be inside the footer.
export default function Disclaimer() {
  return (
    <aside className="disclaimer" aria-label="About this catalogue">
      <p className="container muted small">
        This catalogue lists the books the library holds. Please ask at the library about borrowing.{" "}
        <span className="disclaimer-address">
          Library address: <AddressLink />
        </span>
      </p>
    </aside>
  );
}
