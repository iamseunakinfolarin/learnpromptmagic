import type { Metadata } from "next";
import SkipAhead, { type SkipAheadItem } from "@/components/SkipAhead";
import { getChallenge } from "@/lib/content";
import { SKIP_AHEAD_CHALLENGES } from "@/lib/skipahead";

export const metadata: Metadata = {
  title: "Skip-ahead test",
  description:
    "Already use AI often? Pass six short challenges to open Sous Chef and Kitchen Safety without finishing Prep Cook first.",
};

export default function SkipAheadPage() {
  // Read at build time. A missing challenge, or one of the wrong kind, fails the
  // build here instead of breaking the test for a learner.
  const items: SkipAheadItem[] = SKIP_AHEAD_CHALLENGES.map((id) => {
    const challenge = getChallenge(id);
    if (!challenge) throw new Error(`The Skip-ahead test lists "${id}", which does not exist.`);
    if (challenge.type !== "guess-the-recipe" && challenge.type !== "kitchen-rescue") {
      throw new Error(`The Skip-ahead test lists "${id}", which is a ${challenge.type}.`);
    }
    return challenge;
  });

  return <SkipAhead items={items} />;
}
