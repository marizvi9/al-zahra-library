import Link from "next/link";
import SearchBox from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="container page narrow">
      <h1>Page not found</h1>
      <p className="lede">We couldn’t find that page. Try searching the catalog instead.</p>
      <SearchBox />
      <p>
        <Link href="/">Back to the home page</Link>
      </p>
    </div>
  );
}
