// Small shared links: the library's address (opens Google Maps) and the Islamic Education Center's website.
// Both open in a new tab. The address and web address themselves live in src/lib/library.ts.
import { IEC_URL, LIBRARY_ADDRESS, MAPS_URL } from "@/lib/library";

export function AddressLink({ className = "" }: { className?: string }) {
  return (
    <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className={`address-link ${className}`}>
      {LIBRARY_ADDRESS}
      <span className="visually-hidden"> (opens Google Maps in a new tab)</span>
    </a>
  );
}

export function IecLink({ children = "Islamic Education Center of Houston", className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <a href={IEC_URL} target="_blank" rel="noopener noreferrer" className={`iec-link ${className}`}>
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}
