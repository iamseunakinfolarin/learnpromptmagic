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

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function MedalIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6" />
      <path d="M9 3l3 5 3-5M9.5 14l1.7 1.7 3.3-3.4" />
    </svg>
  );
}
