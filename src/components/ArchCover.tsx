// A stand-in "cover" in the shape of a pointed arch, showing the title.
// Real cover art can replace this in a later step.
export default function ArchCover({ title, size = "large" }: { title: string; size?: "large" | "small" }) {
  return (
    <div className={`arch-cover arch-cover-${size}`} aria-hidden="true">
      <svg viewBox="0 0 120 170" preserveAspectRatio="none" className="arch-cover-frame">
        <path d="M6 168V70C6 36 34 14 60 4C86 14 114 36 114 70V168Z" className="arch-outer" />
        <path d="M14 160V72C14 44 37 25 60 15C83 25 106 44 106 72V160Z" className="arch-inner" />
      </svg>
      {size === "large" && (
        <span className="arch-cover-title" dir="auto">
          {title}
        </span>
      )}
    </div>
  );
}
