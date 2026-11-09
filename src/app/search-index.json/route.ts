// One small file with every book's search details (title, author, category, thumbnail).
// The home page search bar downloads it the first time someone clicks into the bar,
// so the home page itself stays light. It is built once, when the site is built.
import { books, toListItem } from "@/lib/catalog";

export const dynamic = "force-static";

export function GET() {
  return Response.json(books.map(toListItem));
}
