// A light, repeating girih-style star lattice, drawn as an SVG pattern.
// It is purely decorative, so it is hidden from screen readers.
import { useId } from "react";

export default function Girih({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={`girih ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse">
          <g fill="none" strokeWidth="1" strokeLinejoin="round">
            {/* eight-pointed star: two overlapping squares */}
            <path d="M23 23H57V57H23Z" />
            <path d="M40 16L64 40L40 64L16 40Z" />
            {/* lines linking each star to its neighbours */}
            <path d="M40 0V16M40 64V80M0 40H16M64 40H80M0 0L23 23M80 0L57 23M0 80L23 57M80 80L57 57" />
            <circle cx="40" cy="40" r="6" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
