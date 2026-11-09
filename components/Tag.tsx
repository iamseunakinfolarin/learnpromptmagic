import type { ReactNode } from "react";

/** Small outlined label, such as Sample or Coming soon. */
export default function Tag({ children }: { children: ReactNode }) {
  return <span className="tag">{children}</span>;
}
