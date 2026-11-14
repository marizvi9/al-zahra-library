// The library's practical details (address, hours, contact) as a compact list, used on the home
// page, the Visit page and in the footer. Everything comes from src/lib/library.ts.
import Link from "next/link";
import { CONTACT_EMAIL, IEC_PHONE, IEC_PHONE_HREF, LIBRARY_HOURS } from "@/lib/library";
import { AddressLink, IecLink } from "./LibraryLinks";

export function HoursList({ className = "" }: { className?: string }) {
  if (!LIBRARY_HOURS.length)
    return (
      <p className={`hours-pending ${className}`}>
        Opening hours are not published yet. Please <Link href="/contact/">contact us</Link> before you visit.
      </p>
    );
  return (
    <dl className={`hours-list ${className}`}>
      {LIBRARY_HOURS.map(([days, times]) => (
        <div key={days}>
          <dt>{days}</dt>
          <dd>{times}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function VisitInfo({ headingLevel = 3 }: { headingLevel?: 2 | 3 }) {
  const H = `h${headingLevel}` as "h2" | "h3";
  return (
    <div className="visit-info">
      <div className="visit-item">
        <Icon d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z M12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" />
        <div>
          <H className="visit-label">Location</H>
          <p>
            <AddressLink />
          </p>
          <p className="small muted">
            Inside the <IecLink />
          </p>
        </div>
      </div>
      <div className="visit-item">
        <Icon d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3.2 2" />
        <div>
          <H className="visit-label">Hours</H>
          <HoursList />
        </div>
      </div>
      <div className="visit-item">
        <Icon d="M4 6h16v12H4z M4 7l8 6 8-6" />
        <div>
          <H className="visit-label">Contact</H>
          <p>
            <a href={`mailto:${CONTACT_EMAIL}`} className="break-anywhere">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="small muted">
            Islamic Education Center: <a href={IEC_PHONE_HREF}>{IEC_PHONE}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="visit-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
