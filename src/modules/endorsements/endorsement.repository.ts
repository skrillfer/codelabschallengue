import { PoolClient } from "pg";

type CreateBillingDocumentInput = {
  id: string;
  policyId: string;
  amountCents: number;
  currency: string;
};

export async function createBillingDocument(
  client: PoolClient,
  input: CreateBillingDocumentInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO billing_documents (
        id,
        policy_id,
        type,
        amount_cents,
        currency,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      input.id,
      input.policyId,
      "endorsement_adjustment",
      input.amountCents,
      input.currency,
      "open",
    ],
  );
}

export async function findBillingDocumentsByPolicy(
  client: PoolClient,
  policyId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        type,
        amount_cents,
        currency,
        status,
        created_at
      FROM billing_documents
      WHERE policy_id = $1
      ORDER BY created_at DESC
    `,
    [policyId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    amount_cents: Number(row.amount_cents),
    currency: row.currency.trim(),
    status: row.status,
    created_at: row.created_at,
  }));
}
