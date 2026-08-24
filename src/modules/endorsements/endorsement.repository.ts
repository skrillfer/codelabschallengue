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
