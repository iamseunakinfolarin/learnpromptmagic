import Link from "next/link";
import NavLinks from "./NavLinks";
import StatChips from "./StatChips";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href="/">
          Prompt Magic
        </Link>
        <NavLinks />
        <StatChips />
      </div>
    </header>
  );
}
