/**
 * Progress on this device. The only module in the project that touches
 * localStorage. Nothing a learner does leaves their device, there is no
 * account, and every read and write is wrapped: if storage is missing, full,
 * blocked, corrupt, or written by another version, we carry on with a fresh
 * state held in memory and raise a flag the interface can show a notice for.
 */

export const STORAGE_KEY = "pm:progress:v1";

export type Stars = 1 | 2 | 3;
export type ISODate = string;

export type ChallengeResult = {
  stars: Stars;
  attempts: number;
  completedAt: ISODate;
};

export type Progress = {
  version: 1;
  startedAt: ISODate;
  challenges: Record<string, ChallengeResult>;
  stationSteps: Record<string, number>;
  skipAhead: { passed: boolean; passedAt: ISODate | null };
  daily: {
    last: ISODate | null;
    streak: number;
    best: number;
    results: Record<ISODate, { challengeId: string; stars: Stars }>;
  };
  settings: { deeperOpenByDefault: boolean };
};

/** The learner's local calendar date, which is what every date here means. */
export function today(): ISODate {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function freshProgress(): Progress {
  return {
    version: 1,
    startedAt: today(),
    challenges: {},
    stationSteps: {},
    skipAhead: { passed: false, passedAt: null },
    daily: { last: null, streak: 0, best: 0, results: {} },
    settings: { deeperOpenByDefault: false },
  };
}

let memory: Progress | null = null;
let unavailable = false;

/** True when progress could not be read from or written to this device. */
export function isStorageUnavailable(): boolean {
  return unavailable;
}

/* ---------------------------------------------------------------------------
   Change notification, for components that show progress.

   React reads progress as an external store. That needs two things: a way to
   hear about changes (subscribe), and a snapshot whose identity only changes
   when the data does (getSnapshot). load() cannot be the snapshot, because it
   parses saved data into a new object on every call.
   --------------------------------------------------------------------------- */

const listeners = new Set<() => void>();
let snapshot: Progress | null = null;
let storageListenerAttached = false;

/** What the server and the first client render both see: nothing earned yet. */
const serverSnapshot: Progress = freshProgress();

function notify(): void {
  for (const listener of [...listeners]) listener();
}

function onStorageEvent(event: StorageEvent): void {
  // Another tab changed progress. A null key means storage was cleared.
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  snapshot = null;
  notify();
}

/**
 * Calls the listener after every save or reset in this tab, and after another
 * tab changes saved progress. Returns the function that stops listening.
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!storageListenerAttached && typeof window !== "undefined") {
    window.addEventListener("storage", onStorageEvent);
    storageListenerAttached = true;
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && storageListenerAttached) {
      window.removeEventListener("storage", onStorageEvent);
      storageListenerAttached = false;
    }
  };
}

/** The current progress. The same object comes back until it changes. */
export function getSnapshot(): Progress {
  snapshot ??= load();
  return snapshot;
}

/** The progress to render on the server, which knows nothing about a device. */
export function getServerSnapshot(): Progress {
  return serverSnapshot;
}

function storage(): Storage | null {
  try {
    if (typeof globalThis.localStorage === "undefined") return null;
    return globalThis.localStorage;
  } catch {
    // Reading the property itself throws when site data is blocked.
    return null;
  }
}

function fallback(): Progress {
  unavailable = true;
  memory ??= freshProgress();
  return memory;
}

function isStars(value: unknown): value is Stars {
  return value === 1 || value === 2 || value === 3;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks saved data against the shape in docs/content-model.md. Anything that
 * does not fit is treated as corrupt rather than repaired, because a half-read
 * state is harder to reason about than a fresh one.
 */
export function parseProgress(value: unknown): Progress | null {
  if (!isPlainObject(value)) return null;
  if (value.version !== 1) return null;
  if (typeof value.startedAt !== "string") return null;

  const { challenges, stationSteps, skipAhead, daily, settings } = value;
  if (
    !isPlainObject(challenges) ||
    !isPlainObject(stationSteps) ||
    !isPlainObject(skipAhead) ||
    !isPlainObject(daily) ||
    !isPlainObject(settings)
  ) {
    return null;
  }

  for (const result of Object.values(challenges)) {
    if (!isPlainObject(result)) return null;
    if (!isStars(result.stars)) return null;
    if (typeof result.attempts !== "number" || !Number.isFinite(result.attempts)) {
      return null;
    }
    if (typeof result.completedAt !== "string") return null;
  }

  for (const step of Object.values(stationSteps)) {
    if (typeof step !== "number" || !Number.isInteger(step)) return null;
  }

  if (typeof skipAhead.passed !== "boolean") return null;
  if (skipAhead.passedAt !== null && typeof skipAhead.passedAt !== "string") {
    return null;
  }

  if (daily.last !== null && typeof daily.last !== "string") return null;
  if (typeof daily.streak !== "number" || typeof daily.best !== "number") {
    return null;
  }
  if (!isPlainObject(daily.results)) return null;
  for (const result of Object.values(daily.results)) {
    if (!isPlainObject(result)) return null;
    if (typeof result.challengeId !== "string") return null;
    if (!isStars(result.stars)) return null;
  }

  if (typeof settings.deeperOpenByDefault !== "boolean") return null;

  return value as unknown as Progress;
}

/** Reads saved progress, or a fresh state when there is nothing usable. */
export function load(): Progress {
  const store = storage();
  if (!store) return fallback();

  let raw: string | null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return fallback();
  }

  if (raw === null) {
    unavailable = false;
    memory ??= freshProgress();
    return memory;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback();
  }

  const progress = parseProgress(parsed);
  if (!progress) return fallback();

  unavailable = false;
  memory = progress;
  return progress;
}

/** Writes progress, keeping it in memory even when storage refuses. */
export function save(progress: Progress): Progress {
  memory = progress;
  snapshot = progress;
  const store = storage();
  if (!store) {
    unavailable = true;
  } else {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(progress));
      unavailable = false;
    } catch {
      unavailable = true;
    }
  }
  // Listeners run last, so they see whether this save actually reached storage.
  notify();
  return progress;
}

/**
 * Records one attempt at a challenge. The best result so far is kept, so a
 * weaker run never takes stars away, and every attempt is counted.
 */
export function recordChallenge(challengeId: string, stars: Stars): Progress {
  const current = load();
  const previous = current.challenges[challengeId];
  const next: Progress = {
    ...current,
    challenges: {
      ...current.challenges,
      [challengeId]: {
        stars: (previous && previous.stars > stars ? previous.stars : stars) as Stars,
        attempts: (previous?.attempts ?? 0) + 1,
        completedAt: today(),
      },
    },
  };
  return save(next);
}

/** Clears everything saved on this device and starts over. */
export function reset(): Progress {
  const next = freshProgress();
  memory = next;
  snapshot = next;
  const store = storage();
  if (!store) {
    unavailable = true;
  } else {
    try {
      store.removeItem(STORAGE_KEY);
      unavailable = false;
    } catch {
      unavailable = true;
    }
  }
  notify();
  return next;
}

/** Every star earned across every challenge. */
export function totalStars(progress: Progress = load()): number {
  return Object.values(progress.challenges).reduce(
    (sum, result) => sum + result.stars,
    0,
  );
}
