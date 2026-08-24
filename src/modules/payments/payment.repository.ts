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
