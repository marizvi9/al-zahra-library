import Girih from "./Girih";

export default function Footer() {
  return (
    <footer className="site-footer">
      <Girih className="girih-footer" />
      <div className="container footer-inner">
        <p className="footer-name">Al-Zahra Library</p>
        <p>Islamic Education Center</p>
        <p className="muted small">
          This catalogue lists the books the library holds. Please ask at the library about
          borrowing.
        </p>
      </div>
    </footer>
  );
}
