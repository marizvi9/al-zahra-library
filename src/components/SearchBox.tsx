// A plain search form. It sends visitors to /search?q=… and works even
// before JavaScript has loaded.
import { withBase } from "@/lib/paths";

export default function SearchBox({ large = false }: { large?: boolean }) {
  return (
    <form action={withBase("/search/")} method="get" role="search" className={`search-box ${large ? "search-box-large" : ""}`}>
      <label htmlFor="home-search" className="visually-hidden">
        Search by title, author or category
      </label>
      <input
        id="home-search"
        type="search"
        name="q"
        dir="auto"
        placeholder="Search by title, author or category"
        autoComplete="off"
      />
      <button type="submit">Search</button>
    </form>
  );
}
