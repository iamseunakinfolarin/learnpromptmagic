import type { ReactNode } from "react";

type NoteKind = "good" | "bad" | "hint";

const icons: Record<NoteKind, ReactNode> = {
  good: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  ),
  bad: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  hint: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5v.5" />
    </svg>
  ),
};

type NoteProps = {
  kind: NoteKind;
  title: string;
  children?: ReactNode;
  /**
   * Whether this note announces itself to screen readers. On by default. A
   * station turns it off because it announces every result through one live
   * region of its own, and a second announcement would say it twice.
   */
  live?: boolean;
};

/** Feedback note: good, bad, or a hint. */
export default function Note({ kind, title, children, live = true }: NoteProps) {
  return (
    <div className={`note note-${kind}`} role={live ? "status" : undefined}>
      {icons[kind]}
      <div>
        <b>{title}</b>
        {children ? <span>{children}</span> : null}
      </div>
    </div>
  );
}
