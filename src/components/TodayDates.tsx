"use client";

// Today's date and the Islamic (Hijri) date, for the thin bar at the top of every page.
// Worked out in the visitor's browser (the site itself is built ahead of time, so a date written
// at build time would go stale). The Hijri date uses the Umm al-Qura calendar; the start of each
// month depends on the moon sighting, so it can differ by a day from the centre's own calendar:
// set HIJRI_ADJUST_DAYS in src/lib/library.ts to shift it.
import { useEffect, useState } from "react";
import { HIJRI_ADJUST_DAYS } from "@/lib/library";

const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Ula",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa'dah",
  "Dhu al-Hijjah",
];

type Dates = { iso: string; gregorian: string; hijri: string | null };

function today(): Dates {
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const gregorian = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now);
  let hijri: string | null = null;
  try {
    const shifted = new Date(now.getTime() + HIJRI_ADJUST_DAYS * 86_400_000);
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric", year: "numeric" })
        .formatToParts(shifted)
        .map((p) => [p.type, p.value]),
    );
    const month = HIJRI_MONTHS[Number(parts.month) - 1];
    if (month && parts.day && parts.year) hijri = `${parts.day} ${month} ${parts.year.replace(/\D/g, "")} AH`;
  } catch {
    // an old browser without the Islamic calendar: show the ordinary date only
  }
  return { iso, gregorian, hijri };
}

export default function TodayDates() {
  // Nothing is drawn until the page is running in the browser, so the built page never shows an old date.
  const [dates, setDates] = useState<Dates | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      setDates(today());
      // refresh just after midnight, for a page left open overnight
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
      timer = setTimeout(update, next.getTime() - now.getTime());
    };
    update();
    return () => clearTimeout(timer);
  }, []);

  if (!dates) return <span className="header-dates" aria-hidden="true" />;
  return (
    <span className="header-dates">
      <time dateTime={dates.iso}>{dates.gregorian}</time>
      {dates.hijri && <span className="header-hijri">{dates.hijri}</span>}
    </span>
  );
}
