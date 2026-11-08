"""
Clean the Al-Zahra Library catalogue.

Reads:  Al-Zahra_Library_Catalog.csv   (opened READ-ONLY, never modified)
Writes: data/books.json                (the clean data the website uses; public:
                                        no internal notes, no removed books)
        private/books-full.json        (everything, including librarian notes)
        private/cleaning-report.md     (a plain-English list of every change)
The private/ folder and the original CSV are kept off GitHub (see .gitignore).

Run it again any time the spreadsheet is updated:
    python3 scripts/clean_catalog.py
"""

import csv
import io
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Al-Zahra_Library_Catalog.csv"
OUT_DIR = ROOT / "data"
PRIVATE_DIR = ROOT / "private"

# --- Fixes, written out explicitly so they are easy to review -------------

# Letters that were lost (turned into "?") before the file reached us.
LOST_LETTER_FIXES = {
    "Kit?b": "Kitāb",
    "Mahd?": "Mahdī",
    "Faq?h": "Faqīh",
}

# Main categories: correct spelling for each (matched ignoring case/spaces).
CANONICAL_CATEGORIES = [
    "Theology", "Philosophy", "Fiqh", "Governance, Politics & Society",
    "Comparative Religion", "Islamic Schools of Thought", "Quranic Studies",
    "Hadith & Ahlal Bayt Teachings", "History", "Stories & Reflections",
    "Biography", "Miscellaneous", "Literature & Poetry",
    "Duas, Ziyarat & Amaal", "Ethics",
]

# Sub-categories that are clearly the same thing written differently.
SUBCATEGORY_MERGES = {
    "Ahl-Bayt & Imams": "Ahl al-Bayt & Imams",
    "Ahl Al-Bayt": "Ahl al-Bayt & Imams",
    "Usul al-din": "Usul al-Din",
    "prophets": "Prophets",
    "Modern And Contemporary period": "Modern & Contemporary Period",
    "miscellaneous": "Miscellaneous",
}

# The French and Italian books (all had no category in the spreadsheet).
LANGUAGE_CATEGORY = "French & Italian"
FOREIGN_LANGUAGE_TITLES = {
    "La Pratique des Claviers": "French",
    "Les Droits De La Memme En Islam": "French",
    "Pour une Strategie Culturelle Islamique": "French",
    "Le Grand Dijihad ou Iutter Contre Soi-meme": "French",
    "Le Systeme des Rites en Islam": "French",
    "Commento Al Corano": "Italian",
}

# Whole-value corrections (author lists that were missing their commas).
EXACT_FIXES = {
    "Ayatullah Muhammad Baqir Al- Sadr Dr Abdulaziz A Sachedina Sayyid Muhammad Rizvi Husein Khimjee":
        "Ayatullah Muhammad Baqir Al-Sadr, Dr Abdulaziz A. Sachedina, Sayyid Muhammad Rizvi, Husein Khimjee",
    "Ayatullah Murtaza Muthahhri Ayyatullah Nasir Makarim Shirazi Allamah Muhammad Mahdi Asifi Allamah Ibrahim Amini":
        "Ayatullah Murtaza Muthahhari, Ayatullah Nasir Makarim Shirazi, Allamah Muhammad Mahdi Asifi, Allamah Ibrahim Amini",
    "Imamate (The Vicegerency of the Prophet (s.a)": "Imamate (The Vicegerency of the Prophet (s.a))",
}

# Obvious typos in titles, authors and publishers: (wrong text, correct text).
# Applied as find-and-replace inside those three columns only.
TYPO_FIXES = [
    # A find-and-replace in the spreadsheet had turned "Da'wah" into this phrase
    # (verified: Khurram Murad's book is "Da'wah among Non-Muslims in the West").
    ("Interfaith Dialogue & Dawah", "Da'wah"),
    ("Househoold", "Household"), ("The Prophets Househould", "The Prophet's Household"),
    ("Heterdoxy", "Heterodoxy"), ("Avsariyan", "Ansariyan"), ("A Falso and", "A False and"),
    ("Sunni-Shi'I ", "Sunni-Shi'i "), ("al--Udhama", "al-Udhama"), ("A'ala lllahu", "A'la Allahu"),
    ("Propogation", "Propagation"), ("Shariati's Ance Once", "Shariati's And Once"),
    ("De La Memme En", "de la Femme en"), ("Dijihad ou Iutter", "Djihad ou Lutter"),
    ("Cite Du Savior", "Cité du Savoir"), ("Foundationm", "Foundation"), ("Infalliables", "Infallibles"),
    # verified: "Candle of Hope" is by Sayed Mohammad Redha al-Shirazi
    ("Sayed/ Mohammad Redha l-Shirza", "Sayed Mohammad Redha Al-Shirazi"),
    ("A bioghraphy of Muhammad Baqir As- Sadeer", "A Biography of Muhammad Baqir As-Sadr"),
    ("Bioghraphy and Biblioghraphy Of The Foinder of Islamic Republic of Iran: Imam Khomeni",
     "Biography and Bibliography of the Founder of the Islamic Republic of Iran: Imam Khomeini"),
    ("Iilm Al- Usul", "Ilm Al-Usul"), ("Tanzana", "Tanzania"), ('Ash Sharif A Radi"', "Ash-Sharif ar-Radi:"),
    ("Board od Dar", "Board of Dar"), ("Mutafa Zamani", "Mustafa Zamani"), ("Idealogy", "Ideology"),
    ("Immortatlity", "Immortality"), ("al-Samawai", "al-Samawi"),
    ("Sayyud Muhammad Reza Mudarraisi", "Sayyid Muhammad Reza Mudarrisi"), ("Jamal Badwai", "Jamal Badawi"),
    ("Husayn Tabatabi", "Husayn Tabatabai"), ("Understading", "Understanding"), ("Christanity", "Christianity"),
    ("Religous", "Religious"), ("Attaullah Siddiqu", "Attaullah Siddiqui"), ("seond coming", "second coming"),
    ("Mehtodists", "Methodists"), ("Editoral", "Editorial"),
    ("Bahaism it's Origin and it's role", "Bahaism: Its Origin and Its Role"),
    ("and it's Principles", "and Its Principles"), ("It's Nature", "Its Nature"),
    ("School of Though and", "School of Thought and"), ("The Faith if Shia Islam Islam", "The Faith of Shia Islam"),
    ("Nahj Al-Balagah", "Nahj Al-Balaghah"), ("AliBin", "Ali Bin"), ("Hossien", "Hossein"),
    ("Mishab Yazdi", "Misbah Yazdi"), ("Inquires about", "Inquiries about"), ("anf Masael", "and Masael"),
    ("ot the fatwa", "of the fatwa"), ("Maghniyyyah", "Maghniyyah"), ("Twelfth, Imam", "Twelfth Imam"),
    ("M, Ebrahimi", "M. Ebrahimi"), ("By: A J Al Shhar", "A J Al Shhar"), ("Medhi Bazargan", "Mehdi Bazargan"),
    ("Rober Fisk", "Robert Fisk"), ("Revolution , Future", "Revolution, Future"), ("HIstory", "History"),
    ("Lleh Bakhtiar", "Laleh Bakhtiar"), ("Laleh Baktiar", "Laleh Bakhtiar"), ("(pubh & hp)", "(pbuh & hp)"),
    ("Cheif", "Chief"), ("Aphorisims", "Aphorisms"), ("Mohammas", "Mohammad"), ("A DIvine", "A Divine"),
    ("of (Fourteen Infallibles (A.S))", "of the Fourteen Infallibles (A.S)"), ("Discources", "Discourses"),
    ("Ayettullah", "Ayatullah"), ("Marxengels", "Marx-Engels"), ("Pyschoethics", "Psychoethics"),
    ("Shiekh", "Sheikh"), ("Profoundities", "Profundities"), ("Latern of", "Lantern of"), ("HUsayn", "Husayn"),
    ("A Manuel of", "A Manual of"), ("Facism", "Fascism"), ("A Gudie for", "A Guide for"),
    ("Mutada Mutahhari", "Murtada Mutahhari"), ("Musawailari", "Musawi Lari"), ("al_Sa'adat", "al-Sa'adat"),
    ("Qu'ran", "Qur'an"), ("Immamate", "Imamate"), ("Detrivations", "Derivations"), ("Gods Word", "God's Word"),
    ("Materpieces", "Masterpieces"), ("Khursid Ahmad", "Khurshid Ahmad"), ("Tsneema", "Tasneema"),
    ("Abn-Muhammad Ordoni", "Abu Muhammad Ordoni"), ("Imam Al-Risa", "Imam Al-Rida"),
    ("Ayatulla Abu", "Ayatullah Abu"), ("Shia'ism", "Shi'ism"), ("Muhammaed", "Muhammad"),
    ("How to Bridge? The", "How to Bridge the"), ("The Life of imam", "The Life of Imam"),
    ("( For Adults only)", "(For Adults Only)"), ("Shab-e-Barat,Shab-e-Qadr", "Shab-e-Barat, Shab-e-Qadr"),
    ("al- Muzaffar", "al-Muzaffar"), ("al- Ghaibah", "al-Ghaibah"), ("Radi Al- Yasin", "Radi Al-Yasin"),
    ("Abdur- Rahmaan", "Abdur-Rahmaan"), ("Sultanul - Waizin", "Sultanul-Waizin"),
    ("Abu'l - Qasim", "Abu'l-Qasim"), ("Zaynul- A'abidin", "Zaynul-A'abidin"),
]

# Values that mean "no author" rather than a real name.
NOT_AN_AUTHOR = {"N/A", "n/a", "NA"}

NO_CATEGORY = "Uncategorised"
NO_SUBCATEGORY = "General"


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower().replace("&", " and ")
    text = re.sub(r"[‘’'`]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:60].rstrip("-") or "book"


def main() -> None:
    # The file is Windows-1252 ("cp1252"), not UTF-8. Read bytes, decode properly.
    raw_text = SOURCE.read_bytes().decode("cp1252")
    rows = list(csv.reader(io.StringIO(raw_text)))
    header, data = rows[0], rows[1:]

    log = defaultdict(list)      # change type -> list of descriptions
    whitespace_cells = 0
    books = []
    canonical_lookup = {c.lower(): c for c in CANONICAL_CATEGORIES}

    def tidy(value: str, row_no: int, field: str) -> str:
        nonlocal whitespace_cells
        cleaned = re.sub(r"\s+", " ", value).strip()
        if cleaned != value:
            whitespace_cells += 1
        for bad, good in LOST_LETTER_FIXES.items():
            if bad in cleaned:
                cleaned = cleaned.replace(bad, good)
                log["lost_letters"].append(f"Row {row_no} ({field}): “{bad}” → “{good}”")
        return cleaned

    for index, r in enumerate(data, start=1):
        row_no = index + 1  # spreadsheet row number (row 1 is the header)
        r = (r + [""] * 11)[:11]
        title, author, publisher, copies, cat, sub, cat_no, sub_no, book_no, comment, comment2 = (
            tidy(v, row_no, header[i] or "extra") for i, v in enumerate(r)
        )

        # --- typo fixes (title, author, publisher only) ---
        def fix_typos(value: str, field: str) -> str:
            fixed = EXACT_FIXES.get(value, value)
            for wrong, right in TYPO_FIXES:
                fixed = fixed.replace(wrong, right)
            if fixed != value:
                log["typos"].append(f"Row {row_no} ({field}): “{value}” → “{fixed}”")
            return fixed

        title = fix_typos(title, "Title")
        author = fix_typos(author, "Author")
        publisher = fix_typos(publisher, "Publisher")
        if author in NOT_AN_AUTHOR:
            log["typos"].append(f"Row {row_no} (Author): “{author}” → treated as no author")
            author = ""
        title_missing = not title
        if title_missing:
            title = "Title not recorded"
            log["no_title"].append(f"Row {row_no}: author {author or 'unknown'}")

        # --- category ---
        if cat:
            fixed = canonical_lookup.get(cat.lower(), cat)
            if fixed != r[4]:
                log["category"].append(f"Row {row_no}: “{r[4]}” → “{fixed}”")
            cat = fixed
        elif title in FOREIGN_LANGUAGE_TITLES:
            cat = LANGUAGE_CATEGORY
            sub = FOREIGN_LANGUAGE_TITLES[title]
            log["language"].append(f"Row {row_no}: {title} → {cat} / {sub}")
        else:
            cat = NO_CATEGORY
            log["uncategorised"].append(f"Row {row_no}: {title}" + (f" — {author}" if author else ""))

        # --- sub-category ---
        if sub in SUBCATEGORY_MERGES:
            log["subcategory"].append(f"Row {row_no}: “{r[5].strip()}” → “{SUBCATEGORY_MERGES[sub]}”")
            sub = SUBCATEGORY_MERGES[sub]
        elif sub != r[5] and sub:
            pass  # only whitespace / lost-letter changes, already counted
        if not sub:
            sub = NO_SUBCATEGORY
            log["no_subcategory"].append(row_no)

        # --- call number (Book # is empty in the whole file) ---
        cat_digits = cat_no if cat_no.isdigit() else None
        sub_digits = sub_no if sub_no.isdigit() else None
        call_number = " · ".join(p for p in (cat_digits, sub_digits, book_no or None) if p) or None
        if cat_digits and not sub_digits:
            log["partial_call"].append(row_no)
        if not cat_digits:
            log["no_call"].append(f"Row {row_no}: {title}")

        # --- authors ---
        if not author:
            log["no_author_publisher" if publisher else "no_author_unknown"].append(f"Row {row_no}: {title}")

        # --- comments ---
        notes = " / ".join(x for x in (comment, comment2) if x)
        removed = "removed" in notes.lower()
        # Books the librarian could not find are listed, but marked "Not available".
        available = "not seen on shelf" not in notes.lower()
        if not available:
            log["not_available"].append(f"Row {row_no}: {title} ({notes})")

        # No copy count recorded → 1 (as requested by the library). Flagged in the data.
        copies_assumed = not copies.isdigit()
        if copies_assumed:
            log["copies_assumed"].append(row_no)
        if removed:
            log["removed"].append(f"Row {row_no}: {title} ({notes})")
        elif notes and notes.lower() != "booklet":
            log["notes"].append(f"Row {row_no}: {title} — “{notes}”")

        books.append({
            "id": index,
            "slug": f"{index}-{slugify(title)}",
            "title": title,
            "author": author or None,
            "publisher": publisher or None,
            "titleMissing": title_missing,
            "copies": 1 if copies_assumed else int(copies),
            "copiesAssumed": copies_assumed,
            "available": available,
            "category": cat,
            "categorySlug": slugify(cat),
            "subCategory": sub,
            "subCategorySlug": slugify(sub),
            "catNo": cat_digits,
            "subCatNo": sub_digits,
            "bookNo": book_no or None,
            "callNumber": call_number,
            "booklet": "booklet" in notes.lower(),
            "removed": removed,
            "note": notes or None,
            "sourceRow": row_no,
        })

    OUT_DIR.mkdir(exist_ok=True)
    PRIVATE_DIR.mkdir(exist_ok=True)
    (PRIVATE_DIR / "books-full.json").write_text(json.dumps(books, ensure_ascii=False, indent=1), encoding="utf-8")
    # Public copy for the website: drop removed books and internal notes.
    public = [{k: v for k, v in b.items() if k != "note"} for b in books if not b["removed"]]
    (OUT_DIR / "books.json").write_text(json.dumps(public, ensure_ascii=False, indent=1), encoding="utf-8")

    # --- report ---
    shown = [b for b in books if not b["removed"]]
    title_counts = Counter(b["title"].lower() for b in shown)
    dupes = sorted({b["title"] for b in shown if title_counts[b["title"].lower()] > 1})
    cats = Counter(b["category"] for b in shown)

    def section(heading, items):
        out = [f"\n## {heading} ({len(items)})\n"]
        out += [f"- {i}" for i in items] or ["- none"]
        return out

    lines = [
        "# Catalogue cleaning report",
        "",
        f"Source: `{SOURCE.name}` (read-only, Windows-1252 encoding, converted to UTF-8).",
        f"Books in spreadsheet: **{len(books)}** · shown on the website: **{len(shown)}** "
        f"· hidden (removed): **{len(books) - len(shown)}**",
        f"Cells with extra/double spaces tidied: **{whitespace_cells}**",
        f"Books with no sub-category, shown as “{NO_SUBCATEGORY}”: **{len(log['no_subcategory'])}**",
        f"Books with a partial call number (no Sub Cat #): **{len(log['partial_call'])}**",
        f"Books with no copy count, set to 1 (flagged `copiesAssumed`): **{len(log['copies_assumed'])}**",
        "",
        "## Books per category (website)",
        "",
        *[f"- {c}: {n}" for c, n in cats.most_common()],
    ]
    lines += section("Category spelling fixes", log["category"])
    lines += section("Sub-category merges", log["subcategory"])
    lines += section("Lost letters restored", log["lost_letters"])
    lines += section("Typos corrected", log["typos"])
    lines += section("No title in the spreadsheet (shown as “Title not recorded”)", log["no_title"])
    lines += section("Listed but marked “Not available”", log["not_available"])
    lines += section(f"Moved to “{LANGUAGE_CATEGORY}”", log["language"])
    lines += section("Still uncategorised", log["uncategorised"])
    lines += section("Hidden from the website (marked removed)", log["removed"])
    lines += section("Other librarian notes (kept, not shown publicly)", log["notes"])
    lines += section("No author — publisher shown instead", log["no_author_publisher"])
    lines += section("No author or publisher — shown as “Unknown”", log["no_author_unknown"])
    lines += section("No call number at all", log["no_call"])
    lines += section("Titles that appear more than once (kept as separate entries)", dupes)
    (PRIVATE_DIR / "cleaning-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Wrote {len(books)} books ({len(shown)} shown) to data/books.json")
    print("Report: private/cleaning-report.md")


if __name__ == "__main__":
    main()
