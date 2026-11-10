import type { Metadata } from "next";
import { ButtonLink } from "@/components/Button";

export const metadata: Metadata = {
  title: "Not on the menu",
  description: "That page is not on the menu.",
};

export default function NotFound() {
  return (
    <div className="view">
      <div className="view-head">
        <p className="eyebrow">404</p>
        <h1 className="view-title">That&apos;s not on the menu.</h1>
        <p className="lede">
          The page you asked for is not here. The kitchen is still open.
        </p>
      </div>
      <div className="btn-row">
        <ButtonLink href="/kitchen" variant="primary">
          Back to the kitchen
        </ButtonLink>
      </div>
    </div>
  );
}
