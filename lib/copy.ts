/**
 * Copies text to the clipboard. Returns whether it worked, so the caller can
 * fall back to selecting the text for the learner to copy themselves. Clipboard
 * access can be missing or refused, so nothing here is allowed to throw.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Selects the text inside an element, as a fallback when copying is not possible. */
export function selectText(element: HTMLElement | null): void {
  if (!element) return;
  try {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch {
    // Nothing more to try. The text is still on the page to copy by hand.
  }
}
