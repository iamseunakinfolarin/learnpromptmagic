/**
 * Small line icons from the prototype. Each is decorative: whatever it means is
 * always said in words beside it, so none is read out on its own.
 */

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function FlagIcon() {
  return (
    <svg className="flag" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 21V4m0 1h10l-2.2 4L16 13H6" />
    </svg>
  );
}

export function BeakerIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M18 6h12M20 6v12L9 37a4 4 0 0 0 3.5 6h23a4 4 0 0 0 3.5-6L28 18V6" />
      <path d="M14 30h20" />
    </svg>
  );
}
