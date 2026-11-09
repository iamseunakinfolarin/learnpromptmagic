import type { ReactNode } from "react";

type TicketProps = {
  /** Left side of the ticket head, such as "Your order". */
  head: string;
  /** Right side of the ticket head: a number, or a Tag. */
  aside?: ReactNode;
  /** The ticket body, kept in a pre so line breaks survive. */
  children: ReactNode;
  /** Announces changes to the body, for the home page demo. */
  live?: boolean;
};

/**
 * A paper order ticket hanging from a steel clip, with the zigzag bottom edge
 * cut by the mask in globals.css.
 */
export default function Ticket({ head, aside, children, live }: TicketProps) {
  return (
    <div className="ticket-wrap">
      <div className="ticket">
        <div className="ticket-head">
          <span>{head}</span>
          {aside ? <span>{aside}</span> : null}
        </div>
        <pre aria-live={live ? "polite" : undefined}>{children}</pre>
      </div>
    </div>
  );
}
