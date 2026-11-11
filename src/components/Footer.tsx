import Girih from "./Girih";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Girih className="girih-footer" />
      <div className="container footer-inner">
        {/* Two halves that each stay on one line, so on small screens the text wraps neatly at the dash. */}
        <p className="footer-name">
          <span>Al-Zahra Islamic Library -</span> <span>Islamic Education Center of Houston TX © 2026</span>
        </p>
      </div>
    </footer>
  );
}
