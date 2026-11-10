"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/kitchen", label: "Kitchen" },
  { href: "/daily", label: "Daily Special" },
  { href: "/cookbook", label: "Cookbook" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {links.map((link) => {
        const current =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
