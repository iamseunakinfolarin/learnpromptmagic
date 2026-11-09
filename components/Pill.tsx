import type { ReactNode } from "react";

type PillProps = {
  children: ReactNode;
  tone?: "open" | "done" | "quiet";
};

/** Status pill used on station tiles. */
export default function Pill({ children, tone = "quiet" }: PillProps) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
