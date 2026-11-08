// When the site lives in a sub-folder (e.g. GitHub Pages: /al-zahra-library),
// plain links and image paths need that folder in front. Next.js <Link> adds it
// automatically; use withBase() for everything else.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const withBase = (path: string) => `${BASE_PATH}${path}`;
