// Author photos from data/authors.json (Wikimedia Commons, free licences only).
// To remove a photo, delete the author's entry there (or set "photo": null) and rebuild.
//
// HOLY FIGURES ARE NEVER PICTURED. Names in the file's "neverPhoto" list, and any name that
// looks like the Prophet, an Imam of the Ahlul-Bayt, Lady Fatima or Lady Zaynab, always get
// the plain initials badge, even if a photo were added to the file by mistake.

import data from "@data/authors.json";

export type AuthorPhoto = {
  photo: string;
  photoLarge?: string | null;
  largeWidth?: number | null;
  largeHeight?: number | null;
  lowRes?: boolean;
  source: string;
  creator: string;
  license: string;
  licenseUrl: string | null;
  wikipediaUrl: string;
  /** Where the face is, in percent from the left and top; every crop centres on it. */
  focus?: { x: number; y: number; zoom?: number };
};

/**
 * Style for a small square/round badge: centred on the face and, if "zoom" is set, enlarged
 * around it. The shift is limited so the photo always covers the whole badge (no gaps).
 */
export function badgeStyle(p: Pick<AuthorPhoto, "focus">): React.CSSProperties {
  const f = p.focus ?? { x: 50, y: 30 };
  const z = f.zoom ?? 1;
  if (z <= 1) return { objectPosition: `${f.x}% ${f.y}%` };
  const shift = (pos: number) => Math.max(-(100 - pos) * (z - 1), Math.min(pos * (z - 1), 50 - pos));
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transformOrigin: `${f.x}% ${f.y}%`,
    transform: `translate(${shift(f.x).toFixed(1)}%, ${shift(f.y).toFixed(1)}%) scale(${z})`,
  };
}

/** CSS object-position that keeps the face in view when the photo is cropped. */
export const focusPosition = (p: Pick<AuthorPhoto, "focus">) => (p.focus ? `${p.focus.x}% ${p.focus.y}%` : "50% 30%");

type Entry = Partial<AuthorPhoto> & {
  photo?: string | null;
  bio?: string | null;
  bioStatus?: "verified" | "from our data only" | "needs review";
  bioSources?: string[];
};
const file = data as unknown as { neverPhoto: string[]; authors: Record<string, Entry> };

const NEVER = new Set(file.neverPhoto);
// A safety net on top of the list. ("Imam" alone is also a title for living scholars, such as
// Imam Khomeini, so only the names of the Imams of the Ahlul-Bayt are matched.)
const HOLY =
  /\b(prophet|rasul|fatima|fatimah|zahra|zaynab bint|imam (ali|hasan|hassan|husayn|hussain|husain|al-husayn|sajjad|zayn|zain|muhammad al-baqir|baqir|ja'?far|musa al-kadhim|musa al-kazim|kadhim|ali al-ridha|ali al-rida|ridha|rida|jawad|muhammad al-jawad|ali al-hadi|hadi|hasan al-askari|askari|mahdi)\b|zaynul|zayn al-abidin|amir al-mu'?m)/i;

export const isHolyFigure = (name: string) => NEVER.has(name) || HOLY.test(name);

export function photoFor(name: string | null | undefined): AuthorPhoto | null {
  if (!name || isHolyFigure(name)) return null;
  const e = file.authors[name];
  if (!e?.photo || !e.source || !e.license) return null;
  return e as AuthorPhoto;
}

/**
 * The short bio for an author's own page. Only bios marked "verified" are shown;
 * "needs review" drafts and "from our data only" entries show nothing here.
 */
export function bioFor(name: string): { text: string; sources: string[] } | null {
  const e = file.authors[name];
  if (!e?.bio || e.bioStatus !== "verified") return null;
  return { text: e.bio, sources: e.bioSources ?? [] };
}

/** Every author with a photo, for the photo credits page. */
export const allPhotos = () =>
  Object.keys(file.authors)
    .map((name) => ({ name, photo: photoFor(name) }))
    .filter((x): x is { name: string; photo: AuthorPhoto } => x.photo !== null);

const TITLES =
  /^(the|dr|prof|professor|sir|ayatullah|ayatollah|al-uzma|grand|allamah|allama|al-allamah|sayyid|sayyed|sayed|seyyed|seyyid|sayid|syed|seyed|imam|shaykh|sheikh|shaikh|ash-shaykh|al-shaykh|maulana|moulana|maulvi|martyr|martyred|shaheed|hazrat|hadrat|hujjatul|haji|alhaj|mulla|mullah|compiled|compiler|translated|by|editorial|board|of|aagha|agha|aarifibillah)$/i;

/** "Ayatullah Murtaza Mutahhari" → "MM"; "Ahmed Deedat" → "AD"; "Zaynab" → "Z". */
export function initials(name: string) {
  const words = name
    .replace(/\(.*?\)|[,;:&].*$/g, "")
    .replace(/\./g, ". ")
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}'-]/gu, "").replace(/^['-]+|['-]+$/g, ""))
    .filter((w) => w && !TITLES.test(w.replace(/\.$/, "")) && !/^(al|as|at|an|ar|ash|ibn|bin|ibnul|abu|abi|de|von)$/i.test(w));
  if (words.length === 0) return "•";
  const first = words[0].replace(/^(al|as|at|an|ar|ash)-/i, "");
  const last = words[words.length - 1].replace(/^(al|as|at|an|ar|ash)-/i, "");
  return (words.length === 1 ? first[0] : first[0] + last[0]).toUpperCase();
}
