"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};

/**
 * False while the page is being built and while the browser first matches it,
 * then true. Anything that depends on this device, such as progress or today's
 * date, waits for it, so the page that was built and the page that first runs
 * always agree and React has nothing to warn about.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}
