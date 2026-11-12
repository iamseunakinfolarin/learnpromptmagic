/**
 * Display labels for content. These are pure string helpers with no file
 * access, so they are safe to use in components that run in the browser.
 * lib/content/index.ts reads files from disk and must stay on the server.
 */

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** "Station 07", the label used wherever a station is named. */
export function stationLabel(recipe: { number: number }): string {
  return `Station ${pad2(recipe.number)}`;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * "2026-11-12" becomes "12 November 2026". It does not use the browser's
 * locale, so the page that was built and the page that first runs match.
 */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = months[Number(match[2]) - 1];
  if (!month) return iso;
  return `${Number(match[3])} ${month} ${match[1]}`;
}
