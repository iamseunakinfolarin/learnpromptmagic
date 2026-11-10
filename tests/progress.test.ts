import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "pm:progress:v1";

/** A localStorage that behaves. */
function workingStorage(initial?: string) {
  const entries = new Map<string, string>();
  if (initial !== undefined) entries.set(KEY, initial);
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => entries.clear(),
    key: (index: number) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
    raw: entries,
  };
}

/** A localStorage that refuses, the way a blocked or full one does. */
function throwingStorage() {
  const boom = () => {
    throw new Error("storage is not available");
  };
  return {
    getItem: boom,
    setItem: boom,
    removeItem: boom,
    clear: boom,
    key: boom,
    get length(): number {
      return boom();
    },
  };
}

/** A fresh copy of the module, so no state leaks between tests. */
async function progressModule() {
  vi.resetModules();
  return import("../lib/progress");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a device that stores progress", () => {
  let storage: ReturnType<typeof workingStorage>;

  beforeEach(() => {
    storage = workingStorage();
    vi.stubGlobal("localStorage", storage);
  });

  it("starts from a fresh state and reports storage as available", async () => {
    const progress = await progressModule();
    const state = progress.load();
    expect(state.version).toBe(1);
    expect(state.challenges).toEqual({});
    expect(state.daily.streak).toBe(0);
    expect(progress.isStorageUnavailable()).toBe(false);
  });

  it("writes under pm:progress:v1 and reads it back", async () => {
    const progress = await progressModule();
    progress.recordChallenge("the-order-tk", 2);
    expect(storage.raw.has(KEY)).toBe(true);

    const reread = await progressModule();
    expect(reread.load().challenges["the-order-tk"].stars).toBe(2);
  });

  it("keeps the best stars when a later run goes worse", async () => {
    const progress = await progressModule();
    progress.recordChallenge("the-order-tk", 3);
    const state = progress.recordChallenge("the-order-tk", 1);
    expect(state.challenges["the-order-tk"].stars).toBe(3);
  });

  it("takes the better stars when a later run goes better", async () => {
    const progress = await progressModule();
    progress.recordChallenge("the-order-tk", 1);
    const state = progress.recordChallenge("the-order-tk", 3);
    expect(state.challenges["the-order-tk"].stars).toBe(3);
  });

  it("counts every attempt, winning or not", async () => {
    const progress = await progressModule();
    progress.recordChallenge("the-order-tk", 1);
    progress.recordChallenge("the-order-tk", 3);
    const state = progress.recordChallenge("the-order-tk", 2);
    expect(state.challenges["the-order-tk"].attempts).toBe(3);
    expect(state.challenges["the-order-tk"].stars).toBe(3);
  });

  it("adds up stars across challenges", async () => {
    const progress = await progressModule();
    progress.recordChallenge("the-order-tk", 3);
    progress.recordChallenge("the-order-rescue", 2);
    progress.recordChallenge("the-order-guess", 1);
    expect(progress.totalStars()).toBe(6);
  });

  it("clears everything on reset", async () => {
    const progress = await progressModule();
    progress.recordChallenge("the-order-tk", 3);
    const state = progress.reset();
    expect(state.challenges).toEqual({});
    expect(storage.raw.has(KEY)).toBe(false);
    expect(progress.totalStars()).toBe(0);
  });
});

describe("a device with nothing usable saved", () => {
  it("falls back to a fresh state when the saved data is corrupt", async () => {
    vi.stubGlobal("localStorage", workingStorage("{not json at all"));
    const progress = await progressModule();
    const state = progress.load();
    expect(state.challenges).toEqual({});
    expect(progress.isStorageUnavailable()).toBe(true);
  });

  it("falls back when the saved data is from another version", async () => {
    const saved = JSON.stringify({ version: 2, challenges: { x: { stars: 3 } } });
    vi.stubGlobal("localStorage", workingStorage(saved));
    const progress = await progressModule();
    expect(progress.load().challenges).toEqual({});
    expect(progress.isStorageUnavailable()).toBe(true);
  });

  it("falls back when a field has the wrong shape", async () => {
    const saved = JSON.stringify({
      version: 1,
      startedAt: "2026-01-01",
      challenges: { x: { stars: 7, attempts: 1, completedAt: "2026-01-01" } },
      stationSteps: {},
      skipAhead: { passed: false, passedAt: null },
      daily: { last: null, streak: 0, best: 0, results: {} },
      settings: { deeperOpenByDefault: false },
    });
    vi.stubGlobal("localStorage", workingStorage(saved));
    const progress = await progressModule();
    expect(progress.load().challenges).toEqual({});
    expect(progress.isStorageUnavailable()).toBe(true);
  });

  it("reads back a complete saved state untouched", async () => {
    const saved = JSON.stringify({
      version: 1,
      startedAt: "2026-01-01",
      challenges: { x: { stars: 2, attempts: 4, completedAt: "2026-01-02" } },
      stationSteps: { "the-order": 1 },
      skipAhead: { passed: true, passedAt: "2026-01-02" },
      daily: {
        last: "2026-01-02",
        streak: 3,
        best: 5,
        results: { "2026-01-02": { challengeId: "daily-one", stars: 3 } },
      },
      settings: { deeperOpenByDefault: true },
    });
    vi.stubGlobal("localStorage", workingStorage(saved));
    const progress = await progressModule();
    const state = progress.load();
    expect(state.challenges.x.attempts).toBe(4);
    expect(state.daily.streak).toBe(3);
    expect(state.settings.deeperOpenByDefault).toBe(true);
    expect(progress.isStorageUnavailable()).toBe(false);
  });
});

describe("a device where storage is not available", () => {
  it("falls back to memory when localStorage throws", async () => {
    vi.stubGlobal("localStorage", throwingStorage());
    const progress = await progressModule();

    const first = progress.recordChallenge("the-order-tk", 3);
    expect(first.challenges["the-order-tk"].stars).toBe(3);
    expect(progress.isStorageUnavailable()).toBe(true);

    // The in-memory state is still the one being updated.
    const second = progress.recordChallenge("the-order-tk", 1);
    expect(second.challenges["the-order-tk"].stars).toBe(3);
    expect(second.challenges["the-order-tk"].attempts).toBe(2);
    expect(progress.totalStars()).toBe(3);
  });

  it("falls back to memory when there is no localStorage at all", async () => {
    vi.stubGlobal("localStorage", undefined);
    const progress = await progressModule();
    const state = progress.recordChallenge("the-order-guess", 2);
    expect(state.challenges["the-order-guess"].stars).toBe(2);
    expect(progress.isStorageUnavailable()).toBe(true);
  });

  it("still resets, in memory", async () => {
    vi.stubGlobal("localStorage", throwingStorage());
    const progress = await progressModule();
    progress.recordChallenge("the-order-tk", 3);
    expect(progress.reset().challenges).toEqual({});
    expect(progress.totalStars()).toBe(0);
  });
});
