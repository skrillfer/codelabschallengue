import { describe, expect, it } from "vitest";
import { calculateProratedDelta, roundHalfAwayFromZero } from "./proration";

describe("calculateProratedDelta", () => {
  it("calculates the prorated premium difference", () => {
    const result = calculateProratedDelta({
      oldAnnualPremiumCents: 120000,
      newAnnualPremiumCents: 144000,
      termStart: "2026-01-01",
      termEnd: "2027-01-01",
      effectiveDate: "2026-07-01",
    });

    expect(result).toBe(12099);
  });
});

describe("roundHalfAwayFromZero", () => {
  it("rounds positive halves away from zero", () => {
    expect(roundHalfAwayFromZero(1.5)).toBe(2);
  });

  it("rounds negative halves away from zero", () => {
    expect(roundHalfAwayFromZero(-1.5)).toBe(-2);
  });
});
