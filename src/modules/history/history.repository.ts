import { PoolClient } from "pg";
import { createHashFromPayload } from "../../shared/hashing/hash";

type AppendPolicyEventInput = {
  policyId: string;
  eventType: string;
  payload: unknown;
};

export async function appendPolicyEvent(
  client: PoolClient,
  input: AppendPolicyEventInput,
): Promise<void> {
  const previousEvent = await client.query(
    `
      SELECT event_hash
      FROM policy_events
      WHERE policy_id = $1
      ORDER BY id DESC
      LIMIT 1
    `,
    [input.policyId],
  );

  const previousHash = previousEvent.rows[0]?.event_hash ?? null;

  const eventHash = createHashFromPayload({
    policy_id: input.policyId,
    event_type: input.eventType,
    payload: input.payload,
    previous_hash: previousHash,
  });

  await client.query(
    `
      INSERT INTO policy_events (
        policy_id,
        event_type,
        payload,
        previous_hash,
        event_hash
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      input.policyId,
      input.eventType,
      JSON.stringify(input.payload),
      previousHash,
      eventHash,
    ],
  );
}

export type PolicyEvent = {
  id: number;
  policyId: string;
  eventType: string;
  payload: unknown;
  previousHash: string | null;
  eventHash: string;
  createdAt: Date;
};

export async function findPolicyEvents(
  client: PoolClient,
  policyId: string,
): Promise<PolicyEvent[]> {
  const result = await client.query(
    `
      SELECT
        id,
        policy_id,
        event_type,
        payload,
        previous_hash,
        event_hash,
        created_at
      FROM policy_events
      WHERE policy_id = $1
      ORDER BY id ASC
    `,
    [policyId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    policyId: row.policy_id,
    eventType: row.event_type,
    payload: row.payload,
    previousHash: row.previous_hash,
    eventHash: row.event_hash,
    createdAt: row.created_at,
  }));
}
