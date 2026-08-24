import { db } from "../../db/connection";
import { createHashFromPayload } from "../../shared/hashing/hash";
import { AppError } from "../../shared/errors/app-error";
import { findPolicyById } from "../policies/policy.repository";
import { findPolicyEvents } from "./history.repository";

export async function getPolicyHistory(policyId: string) {
  const client = await db.connect();

  try {
    const policy = await findPolicyById(client, policyId);

    if (!policy) {
      throw new AppError("Policy not found", 404);
    }

    const events = await findPolicyEvents(client, policyId);

    let expectedPreviousHash: string | null = null;
    let chainValid = true;

    for (const event of events) {
      if (event.previousHash !== expectedPreviousHash) {
        chainValid = false;
        break;
      }

      const expectedHash = createHashFromPayload({
        policy_id: event.policyId,
        event_type: event.eventType,
        payload: event.payload,
        previous_hash: event.previousHash,
      });

      if (expectedHash !== event.eventHash) {
        chainValid = false;
        break;
      }

      expectedPreviousHash = event.eventHash;
    }

    return {
      policy_id: policyId,
      chain_valid: chainValid,

      events: events.map((event) => ({
        id: event.id,
        event_type: event.eventType,
        payload: event.payload,
        previous_hash: event.previousHash,
        event_hash: event.eventHash,
        created_at: event.createdAt,
      })),
    };
  } finally {
    client.release();
  }
}
