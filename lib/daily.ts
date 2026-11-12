import type { ISODate, Progress, Stars } from "./progress";

/**
 * The Daily Special: which one plays today, and how the streak moves.
 *
 * Dates are the learner's local calendar dates, written "YYYY-MM-DD". Every
 * calculation here works on calendar days, never on milliseconds, so a clock
 * change in spring or autumn can never move a day.
 */

function parts(iso: ISODate): [number, number, number] {
  const [year, month, day] = iso.split("-").map(Number);
  return [year, month, day];
}

/** Whole calendar days from one date to another. Negative when `to` is earlier. */
export function daysBetween(from: ISODate, to: ISODate): number {
  const [fy, fm, fd] = parts(from);
  const [ty, tm, td] = parts(to);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** The calendar day before a date. */
export function previousDay(iso: ISODate): ISODate {
  const [year, month, day] = parts(iso);
  const date = new Date(Date.UTC(year, month - 1, day - 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Today's Daily Special number, counting the launch date as 1. It is 0 or
 * lower before the launch date.
 */
export function dailyNumber(launchDate: ISODate, today: ISODate): number {
  return daysBetween(launchDate, today) + 1;
}

/** The special for a number: the schedule repeats once it runs out. */
export function dailyIdFor(order: string[], number: number): string | null {
  if (number < 1 || order.length === 0) return null;
  return order[(number - 1) % order.length];
}

/**
 * Records a finished Daily Special and moves the streak.
 *
 * A day that already has a result is left alone, so a special counts once a day.
 * Playing the day after the last one continues the streak, and any other gap
 * starts it again at 1. The best streak is kept.
 */
export function recordDaily(
  progress: Progress,
  date: ISODate,
  challengeId: string,
  stars: Stars,
): Progress {
  const daily = progress.daily;
  if (daily.results[date]) return progress;

  const results = { ...daily.results, [date]: { challengeId, stars } };

  // A date earlier than the last one played, such as after the clock was set
  // back, keeps its result but does not touch the streak.
  if (daily.last !== null && daily.last > date) {
    return { ...progress, daily: { ...daily, results } };
  }

  let streak = 1;
  if (daily.last === previousDay(date)) streak = daily.streak + 1;
  else if (daily.last === date) streak = Math.max(1, daily.streak);

  return {
    ...progress,
    daily: { last: date, streak, best: Math.max(daily.best, streak), results },
  };
}

/**
 * The streak to show. It only counts while the last special was today or
 * yesterday, so a missed day shows 0 even before anything is saved.
 */
export function streakNow(progress: Progress, today: ISODate): number {
  const { last, streak } = progress.daily;
  return last === today || last === previousDay(today) ? streak : 0;
}

/** The text a learner copies to share a result. */
export function shareText(options: { number: number; stars: number; origin?: string }): string {
  const { number, stars, origin } = options;
  const row = "★".repeat(stars) + "☆".repeat(Math.max(0, 3 - stars));
  const lines = [`Prompt Magic Daily Special #${number}`, `${row} ${stars} of 3 stars`];
  if (origin) lines.push(origin);
  return lines.join("\n");
}
