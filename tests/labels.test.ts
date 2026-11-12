import { describe, expect, it } from "vitest";
import { formatDate, pad2, stationLabel } from "../lib/content/labels";

describe("stationLabel", () => {
  it("pads the number to two digits", () => {
    expect(stationLabel({ number: 1 })).toBe("Station 01");
    expect(stationLabel({ number: 12 })).toBe("Station 12");
    expect(pad2(7)).toBe("07");
  });
});

describe("formatDate", () => {
  it("writes the day, the month name, and the year", () => {
    expect(formatDate("2026-11-12")).toBe("12 November 2026");
    expect(formatDate("2026-01-05")).toBe("5 January 2026");
    expect(formatDate("2027-12-31")).toBe("31 December 2027");
  });

  it("gives the same text whatever the machine's locale or time zone", () => {
    const first = formatDate("2026-06-01");
    expect(first).toBe("1 June 2026");
    expect(formatDate("2026-06-01")).toBe(first);
  });

  it("hands back anything that is not a date, rather than guessing", () => {
    expect(formatDate("soon")).toBe("soon");
    expect(formatDate("2026-13-01")).toBe("2026-13-01");
  });
});
