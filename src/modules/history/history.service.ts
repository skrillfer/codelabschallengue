import { db } from "../../db/connection";
import { AppError } from "../../shared/errors/app-error";
import { findPolicyById } from "../policies/policy.repository";
import { findPolicyEvents } from "./history.repository";
import { verifyHistoryChain } from "./history.validation";
export async function getPolicyHistory(policyId: string) {
  const client = await db.connect();

  try {
    const policy = await findPolicyById(client, policyId);

    if (!policy) {
      throw new AppError("Policy not found", 404);
    }

    const events = await findPolicyEvents(client, policyId);

    const chainValid = verifyHistoryChain(events);

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
