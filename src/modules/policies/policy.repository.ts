import { PoolClient } from "pg";
import { Policy } from "./policy.types";

export async function findPolicyForUpdate(
  client: PoolClient,
  policyId: string,
): Promise<Policy | null> {
  const result = await client.query(
    `
      SELECT
        id,
        homeowner_id,
        status,
        term_start::TEXT AS term_start,
        term_end::TEXT AS term_end,
        annual_premium_cents,
        currency
      FROM policies
      WHERE id = $1
      FOR UPDATE
    `,
    [policyId],
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    homeownerId: row.homeowner_id,
    status: row.status,
    termStart: row.term_start,
    termEnd: row.term_end,
    annualPremiumCents: Number(row.annual_premium_cents),
    currency: row.currency.trim(),
  };
}

export async function updateAnnualPremium(
  client: PoolClient,
  policyId: string,
  annualPremiumCents: number,
): Promise<void> {
  await client.query(
    `
      UPDATE policies
      SET
        annual_premium_cents = $1,
        updated_at = NOW()
      WHERE id = $2
    `,
    [annualPremiumCents, policyId],
  );
}

export async function findPolicyById(
  client: PoolClient,
  policyId: string,
): Promise<Policy | null> {
  const result = await client.query(
    `
      SELECT
        id,
        homeowner_id,
        status,
        term_start::TEXT AS term_start,
        term_end::TEXT AS term_end,
        annual_premium_cents,
        currency
      FROM policies
      WHERE id = $1
    `,
    [policyId],
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];

  return {
    id: row.id,
    homeownerId: row.homeowner_id,
    status: row.status,
    termStart: row.term_start,
    termEnd: row.term_end,
    annualPremiumCents: Number(row.annual_premium_cents),
    currency: row.currency.trim(),
  };
}
