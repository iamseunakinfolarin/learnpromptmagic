import { describe, expect, it } from "vitest";
import { getDailyChallenges, getDailySchedule } from "../lib/content";
import {
  dailyIdFor,
  dailyNumber,
  daysBetween,
  previousDay,
  recordDaily,
  shareText,
  streakNow,
} from "../lib/daily";
import { freshProgress, type Progress } from "../lib/progress";

describe("counting days", () => {
  it("counts whole calendar days between two dates", () => {
    expect(daysBetween("2026-11-09", "2026-11-09")).toBe(0);
    expect(daysBetween("2026-11-09", "2026-11-12")).toBe(3);
    expect(daysBetween("2026-11-12", "2026-11-09")).toBe(-3);
  });

  it("crosses month and year ends", () => {
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2); // a leap year
  });

  it("is not moved by a clock change, because it counts calendar days", () => {
    // Clocks change in these spans in many places. Days must still be whole.
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
    expect(daysBetween("2026-11-01", "2026-11-03")).toBe(2);
  });

  it("finds the day before, across month and year ends", () => {
    expect(previousDay("2026-11-12")).toBe("2026-11-11");
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(previousDay("2028-03-01")).toBe("2028-02-29");
    expect(previousDay("2027-01-01")).toBe("2026-12-31");
  });
});

describe("which special plays today", () => {
  const order = ["a", "b", "c"];

  it("counts the launch date as number 1", () => {
    expect(dailyNumber("2026-11-09", "2026-11-09")).toBe(1);
    expect(dailyNumber("2026-11-09", "2026-11-12")).toBe(4);
  });

  it("is zero or lower before the launch date, and plays nothing", () => {
    expect(dailyNumber("2026-11-09", "2026-11-08")).toBe(0);
    expect(dailyIdFor(order, 0)).toBeNull();
    expect(dailyIdFor(order, -4)).toBeNull();
  });

  it("plays the schedule in order from number 1", () => {
    expect(dailyIdFor(order, 1)).toBe("a");
    expect(dailyIdFor(order, 2)).toBe("b");
    expect(dailyIdFor(order, 3)).toBe("c");
  });

  it("starts the schedule again when it runs out", () => {
    expect(dailyIdFor(order, 4)).toBe("a");
    expect(dailyIdFor(order, 6)).toBe("c");
    expect(dailyIdFor(order, 7)).toBe("a");
  });

  it("plays nothing from an empty schedule", () => {
    expect(dailyIdFor([], 3)).toBeNull();
  });

  it("gives every day for a year a special that exists, on the real schedule", () => {
    const schedule = getDailySchedule();
    const real = new Set(getDailyChallenges().map((c) => c.id));
    for (let n = 1; n <= 400; n++) expect(real.has(dailyIdFor(schedule.order, n)!), `day ${n}`).toBe(true);
  });
});

describe("the streak", () => {
  const play = (p: Progress, date: string, stars: 1 | 2 | 3 = 3) => recordDaily(p, date, "daily-x", stars);

  it("starts at 1 on a first special", () => {
    const p = play(freshProgress(), "2026-11-12");
    expect(p.daily.streak).toBe(1);
    expect(p.daily.best).toBe(1);
    expect(p.daily.last).toBe("2026-11-12");
    expect(p.daily.results["2026-11-12"]).toEqual({ challengeId: "daily-x", stars: 3 });
  });

  it("continues on the next day", () => {
    let p = play(freshProgress(), "2026-11-12");
    p = play(p, "2026-11-13");
    p = play(p, "2026-11-14");
    expect(p.daily.streak).toBe(3);
    expect(p.daily.best).toBe(3);
  });

  it("continues across a month and a year end", () => {
    let p = play(freshProgress(), "2026-12-31");
    p = play(p, "2027-01-01");
    expect(p.daily.streak).toBe(2);
  });

  it("starts again at 1 after a missed day, and keeps the best", () => {
    let p = play(freshProgress(), "2026-11-12");
    p = play(p, "2026-11-13");
    p = play(p, "2026-11-15");
    expect(p.daily.streak).toBe(1);
    expect(p.daily.best).toBe(2);
  });

  it("counts a special only once a day", () => {
    const once = play(freshProgress(), "2026-11-12", 3);
    const twice = play(once, "2026-11-12", 1);
    expect(twice).toBe(once);
    expect(twice.daily.results["2026-11-12"].stars).toBe(3);
  });

  it("keeps the streak untouched when an earlier date is recorded", () => {
    let p = play(freshProgress(), "2026-11-12");
    p = play(p, "2026-11-13");
    const back = play(p, "2026-11-10");
    expect(back.daily.streak).toBe(2);
    expect(back.daily.last).toBe("2026-11-13");
    expect(back.daily.results["2026-11-10"]).toBeDefined();
  });

  it("does not change the progress it was given", () => {
    const before = freshProgress();
    const snapshot = JSON.stringify(before);
    play(before, "2026-11-12");
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("the streak that is shown", () => {
  const played = (last: string, streak: number): Progress => ({
    ...freshProgress(),
    daily: { last, streak, best: streak, results: {} },
  });

  it("shows the streak while the last special was today or yesterday", () => {
    expect(streakNow(played("2026-11-12", 4), "2026-11-12")).toBe(4);
    expect(streakNow(played("2026-11-11", 4), "2026-11-12")).toBe(4);
  });

  it("shows 0 once a day has been missed, even though the saved streak is still 4", () => {
    expect(streakNow(played("2026-11-10", 4), "2026-11-12")).toBe(0);
  });

  it("shows 0 for a learner who has never played one", () => {
    expect(streakNow(freshProgress(), "2026-11-12")).toBe(0);
  });
});

describe("the text to share", () => {
  it("shows the number, a row of stars, and the address", () => {
    expect(shareText({ number: 4, stars: 2, origin: "https://example.org" })).toBe(
      "Prompt Magic Daily Special #4\n★★☆ 2 of 3 stars\nhttps://example.org",
    );
  });

  it("leaves the address out when there is none", () => {
    expect(shareText({ number: 14, stars: 3 })).toBe("Prompt Magic Daily Special #14\n★★★ 3 of 3 stars");
  });

  it("fills the empty stars", () => {
    expect(shareText({ number: 1, stars: 1 })).toContain("★☆☆ 1 of 3 stars");
  });
});
