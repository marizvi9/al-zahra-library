// A small decorative divider: two gold hairlines that fade out, with an eight-pointed star
// between them. Purely decorative, so screen readers skip it.
export default function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 240 20" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ornament-fade-l" gradientUnits="userSpaceOnUse" x1="8" x2="98" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
        <linearGradient id="ornament-fade-r" gradientUnits="userSpaceOnUse" x1="232" x2="142" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <path d="M8 10H98" stroke="url(#ornament-fade-l)" strokeWidth="1.2" />
      <path d="M142 10H232" stroke="url(#ornament-fade-r)" strokeWidth="1.2" />
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M113 3H127V17H113Z" />
        <path d="M120 0.1L129.9 10L120 19.9L110.1 10Z" />
      </g>
      <circle cx="120" cy="10" r="2" fill="currentColor" />
      <circle cx="104" cy="10" r="1.4" fill="currentColor" />
      <circle cx="136" cy="10" r="1.4" fill="currentColor" />
    </svg>
  );
}
