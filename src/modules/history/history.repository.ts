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
