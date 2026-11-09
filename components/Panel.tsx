import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  as?: "section" | "div" | "article";
};

/** Paper panel: the white card with the 2px ink border. */
export default function Panel({
  children,
  className,
  labelledBy,
  as: Tag = "section",
}: PanelProps) {
  return (
    <Tag
      className={["panel", className].filter(Boolean).join(" ")}
      aria-labelledby={labelledBy}
    >
      {children}
    </Tag>
  );
}
