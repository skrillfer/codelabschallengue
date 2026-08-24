export type LedgerEntryInput = {
  account: string;
  entryType: "debit" | "credit";
  amountCents: number;
};

export function validateBalancedEntries(entries: LedgerEntryInput[]): void {
  const totalDebits = entries
    .filter((entry) => entry.entryType === "debit")
    .reduce((total, entry) => total + entry.amountCents, 0);

  const totalCredits = entries
    .filter((entry) => entry.entryType === "credit")
    .reduce((total, entry) => total + entry.amountCents, 0);

  if (totalDebits !== totalCredits) {
    throw new Error("Ledger transaction is not balanced");
  }
}
