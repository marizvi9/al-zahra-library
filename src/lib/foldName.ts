/** Lower case, no accents, apostrophes or hyphens, so "Ja'far", "Jafar" and "ja far" match. */
export const foldName = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[''ʿʾ`.]/g, "")
    .replace(/[-_,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
