"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { reset } from "@/lib/progress";

/**
 * Clears everything saved on this device, after asking once. The question sits
 * where the link was, so there is no dialog to lose focus in: focus moves to
 * "Yes" when it opens and back to "Start over" if the learner cancels.
 */
export default function StartOver() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const startRef = useRef<HTMLButtonElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  useEffect(() => {
    if (confirming) {
      yesRef.current?.focus();
    } else if (returnFocus.current) {
      returnFocus.current = false;
      startRef.current?.focus();
    }
  }, [confirming]);

  function confirmReset() {
    reset();
    setConfirming(false);
    setMessage("Progress cleared. Fresh kitchen.");
    router.push("/");
  }

  return (
    <span className="start-over">
      {confirming ? (
        <>
          <span>Clear all progress on this device?</span>
          <button type="button" className="linkish" ref={yesRef} onClick={confirmReset}>
            Yes, start over
          </button>
          <button
            type="button"
            className="linkish"
            onClick={() => {
              returnFocus.current = true;
              setConfirming(false);
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <button type="button" className="linkish" ref={startRef} onClick={() => setConfirming(true)}>
          Start over
        </button>
      )}
      <span role="status" aria-live="polite" className={message ? "fine" : "sr-only"}>
        {message}
      </span>
    </span>
  );
}
