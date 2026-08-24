import { PoolClient } from "pg";

type CreatePaymentInput = {
  id: string;
  policyId: string;
  externalPaymentId: string;
  amountCents: number;
  currency: string;
  receivedAt: string;
};

export async function createPayment(
  client: PoolClient,
  input: CreatePaymentInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO payments (
        id,
        policy_id,
        external_payment_id,
        amount_cents,
        currency,
        received_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      input.id,
      input.policyId,
      input.externalPaymentId,
      input.amountCents,
      input.currency,
      input.receivedAt,
    ],
  );
}

export async function findPaymentsByPolicy(
  client: PoolClient,
  policyId: string,
) {
  const result = await client.query(
    `
      SELECT
        id,
        external_payment_id,
        amount_cents,
        currency,
        received_at
      FROM payments
      WHERE policy_id = $1
      ORDER BY received_at DESC
    `,
    [policyId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    external_payment_id: row.external_payment_id,
    amount_cents: Number(row.amount_cents),
    currency: row.currency.trim(),
    received_at: row.received_at,
  }));
}
