"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type Progress,
} from "@/lib/progress";

/**
 * Progress on this device, as React state. The server and the first client
 * render both see an empty state, so the page that was built and the page that
 * first runs agree, and the real progress arrives straight after.
 */
export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
