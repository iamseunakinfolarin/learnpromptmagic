import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
};

function classes(variant: Variant, extra?: string): string {
  return ["btn", variant === "primary" ? "btn-primary" : "", extra]
    .filter(Boolean)
    .join(" ");
}

/** A link styled as a button, for moving between pages. */
export function ButtonLink({
  children,
  variant = "secondary",
  className,
  ...rest
}: ButtonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={classes(variant, className)} {...rest}>
      {children}
    </Link>
  );
}

/** A real button, for things that happen on the page. */
export default function Button({
  children,
  variant = "secondary",
  className,
  type = "button",
  ...rest
}: ButtonProps & ComponentProps<"button">) {
  return (
    <button className={classes(variant, className)} type={type} {...rest}>
      {children}
    </button>
  );
}
