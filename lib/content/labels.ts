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
