import { PoolClient } from "pg";

type LedgerEntry = {
  account: "cash" | "premium_receivable" | "written_premium";
  entryType: "debit" | "credit";
  amountCents: number;
};

type CreateLedgerTransactionInput = {
  id: string;
  policyId: string;
  sourceType: "endorsement" | "payment";
  sourceId: string;
  entries: LedgerEntry[];
};

export async function createLedgerTransaction(
  client: PoolClient,
  input: CreateLedgerTransactionInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO ledger_transactions (
        id,
        policy_id,
        source_type,
        source_id
      )
      VALUES ($1, $2, $3, $4)
    `,
    [input.id, input.policyId, input.sourceType, input.sourceId],
  );

  for (const entry of input.entries) {
    await client.query(
      `
        INSERT INTO ledger_entries (
          transaction_id,
          account,
          entry_type,
          amount_cents
        )
        VALUES ($1, $2, $3, $4)
      `,
      [input.id, entry.account, entry.entryType, entry.amountCents],
    );
  }
}

export async function getPremiumReceivableBalance(
  client: PoolClient,
  policyId: string,
): Promise<number> {
  const result = await client.query(
    `
      SELECT COALESCE(
        SUM(
          CASE
            WHEN le.entry_type = 'debit'
              THEN le.amount_cents
            WHEN le.entry_type = 'credit'
              THEN -le.amount_cents
          END
        ),
        0
      ) AS balance
      FROM ledger_entries le
      INNER JOIN ledger_transactions lt
        ON lt.id = le.transaction_id
      WHERE lt.policy_id = $1
        AND le.account = 'premium_receivable'
    `,
    [policyId],
  );

  return Number(result.rows[0].balance);
}
