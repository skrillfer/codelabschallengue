type ProrationInput = {
  oldAnnualPremiumCents: number;
  newAnnualPremiumCents: number;
  termStart: string;
  termEnd: string;
  effectiveDate: string;
};

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

export function calculateProratedDelta({
  oldAnnualPremiumCents,
  newAnnualPremiumCents,
  termStart,
  termEnd,
  effectiveDate,
}: ProrationInput): number {
  const termDays = daysBetween(termStart, termEnd);
  const remainingDays = daysBetween(effectiveDate, termEnd);

  const annualPremiumDifference = newAnnualPremiumCents - oldAnnualPremiumCents;

  const proratedAmount = (annualPremiumDifference * remainingDays) / termDays;

  return roundHalfAwayFromZero(proratedAmount);
}

function daysBetween(start: string, end: string): number {
  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);

  return (endTime - startTime) / MILLISECONDS_PER_DAY;
}

export function roundHalfAwayFromZero(value: number): number {
  if (value >= 0) {
    return Math.floor(value + 0.5);
  }

  return Math.ceil(value - 0.5);
}
