// A tiny page that forwards visitors from an old address to its new home.
// The site is plain files (no server), so this uses an instant "refresh" tag,
// a one-line script as a backup, and a normal link if both are blocked.
import Link from "next/link";
import { withBase } from "@/lib/paths";

export default function Redirect({ to }: { to: string }) {
  const url = withBase(to);
  return (
    <div className="container page narrow">
      <meta httpEquiv="refresh" content={`0; url=${url}`} />
      <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(url)})` }} />
      <h1>This page has moved</h1>
      <p className="lede">
        <Link href={to}>Continue to Explore by shelves</Link>
      </p>
    </div>
  );
}
