import type { Metadata } from "next";
import DailySpecial from "@/components/DailySpecial";
import { getDailyChallenges, getDailySchedule } from "@/lib/content";
import type { GuessTheRecipe } from "@/lib/content/schemas";

export const metadata: Metadata = {
  title: "Daily Special",
  description: "One short challenge a day, the same for everyone, with a streak to keep.",
};

export default function DailyPage() {
  const schedule = getDailySchedule();
  const challenges = getDailyChallenges();

  // The page plays Guess the Recipe. A special of any other kind fails the build
  // here, with its name, instead of failing for a learner on the day it plays.
  const items: GuessTheRecipe[] = schedule.order.map((id) => {
    const challenge = challenges.find((candidate) => candidate.id === id);
    if (!challenge) throw new Error(`The schedule lists "${id}", which does not exist.`);
    if (challenge.type !== "guess-the-recipe") {
      throw new Error(`The Daily Special page plays Guess the Recipe, but "${id}" is a ${challenge.type}.`);
    }
    return challenge;
  });

  return <DailySpecial launchDate={schedule.launchDate} items={items} />;
}
