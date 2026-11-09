// Strict "is this the same book?" check, shared by the cover and description scripts.
// A match needs the author AND the title to agree; books with no author need an
// exact title of three or more words. (Moved here unchanged from fetch_covers.mjs.)
export const HONORIFICS = new Set(
  ("ayatullah ayatollah ayatulla allamah allama imam sayyid sayed seyyed seyyid syed sayid sayyed shaykh sheikh " +
    "shaikh shiekh dr prof professor martyr maulana moulana hojjatul islam al the by compiled translated edited " +
    "and with mr mrs ms md phd hazrat haji hajj grand uzma " +
    // very common names: on their own they don't prove it's the same author
    "muhammad mohammad mohammed muhammed mohamed ahmad ahmed husain hussain husayn hussein hasan hassan " +
    "abdul abdullah abbas jafar jaffar reza rida raza mahdi mehdi").split(" "),
);
export const norm = (s) =>
  (s ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’`ʿʾ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export const mainTitle = (t) => t.split(/\s[-–:]\s|:\s|\(/)[0].trim();
const stripArticle = (s) => s.replace(/^(the|a|an) /, "");

function similarity(a, b) {
  if (a === b) return 1;
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

function titleMatches(bookTitle, candidate, strict) {
  const a = stripArticle(norm(bookTitle));
  const b = stripArticle(norm(candidate));
  const am = stripArticle(norm(mainTitle(bookTitle)));
  const bm = stripArticle(norm(mainTitle(candidate)));
  if (strict) return (a === b || am === bm) && am.split(" ").length >= 3;
  return similarity(a, b) >= 0.9 || (similarity(am, bm) >= 0.92 && am.split(" ").length >= 2);
}

export const nameTokens = (s) => norm(s).split(" ").filter((t) => t.length >= 4 && !HONORIFICS.has(t));
function authorMatches(bookAuthor, candidates) {
  const mine = nameTokens(bookAuthor);
  const theirs = nameTokens((candidates ?? []).join(" "));
  return mine.some((x) => theirs.some((y) => similarity(x, y) >= 0.8));
}

export function accept(book, title, authors) {
  if (book.author) {
    if (!authorMatches(book.author, authors)) return false;
    // Same author: also accept when our title starts with theirs (they store the subtitle separately).
    const ours = stripArticle(norm(book.title));
    const theirs = stripArticle(norm(title));
    return titleMatches(book.title, title, false) || (theirs.length >= 4 && ours.startsWith(theirs + " ")) || ours === theirs;
  }
  return titleMatches(book.title, title, true);
}
