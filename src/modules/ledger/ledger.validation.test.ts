import { describe, expect, it } from "vitest";
import { validateBalancedEntries } from "./ledger.validation";

describe("validateBalancedEntries", () => {
  it("accepts a balanced endorsement transaction", () => {
    expect(() =>
      validateBalancedEntries([
        {
          account: "premium_receivable",
          entryType: "debit",
          amountCents: 12099,
        },
        {
          account: "written_premium",
          entryType: "credit",
          amountCents: 12099,
        },
      ]),
    ).not.toThrow();
  });

  it("accepts a balanced payment transaction", () => {
    expect(() =>
      validateBalancedEntries([
        {
          account: "cash",
          entryType: "debit",
          amountCents: 12099,
        },
        {
          account: "premium_receivable",
          entryType: "credit",
          amountCents: 12099,
        },
      ]),
    ).not.toThrow();
  });

  it("rejects an unbalanced transaction", () => {
    expect(() =>
      validateBalancedEntries([
        {
          account: "cash",
          entryType: "debit",
          amountCents: 12099,
        },
        {
          account: "premium_receivable",
          entryType: "credit",
          amountCents: 10000,
        },
      ]),
    ).toThrow("Ledger transaction is not balanced");
  });
});
