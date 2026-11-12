import Link from "next/link";
import StartOver from "./StartOver";

const links = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>Free to use. Your progress stays on this device.</p>
        <div className="footer-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <StartOver />
        </div>
      </div>
    </footer>
  );
}
