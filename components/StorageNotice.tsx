"use client";

import { useEffect, useRef, useState } from "react";
import { isStorageUnavailable, subscribe } from "@/lib/progress";

/**
 * A quiet note for a browser that will not keep progress, such as one with
 * site data blocked or a private window.
 *
 * It appears after a save that did not reach storage, not on load. That keeps
 * it honest: reading corrupt saved data also raises the storage flag, but the
 * next save repairs that, so there is nothing to warn about. It shows at most
 * once per visit, never blocks play, and the learner can dismiss it.
 *
 * The live region is always on the page and empty until needed, which is what
 * makes a screen reader announce the text when it arrives.
 */
export default function StorageNotice() {
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);

  useEffect(
    () =>
      subscribe(() => {
        if (shown.current || !isStorageUnavailable()) return;
        shown.current = true;
        setVisible(true);
      }),
    [],
  );

  return (
    <div className="wrap" role="status">
      {visible ? (
        <div className="notice">
          <p>
            Your progress can&apos;t be saved in this browser. Play still works, but your results
            won&apos;t be kept.
          </p>
          <button type="button" className="linkish" onClick={() => setVisible(false)}>
            Got it
          </button>
        </div>
      ) : null}
    </div>
  );
}
