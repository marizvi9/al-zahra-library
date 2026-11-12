// One small file with every book's and author's search details (title, name, category, thumbnail,
// photo framing). The search bar downloads it the first time someone clicks into it, so pages
// stay light. It is built once, when the site is built.
import { searchData } from "@/lib/searchData";

export const dynamic = "force-static";

export function GET() {
  return Response.json(searchData());
}
