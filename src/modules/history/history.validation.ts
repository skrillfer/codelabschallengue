import { createHashFromPayload } from "../../shared/hashing/hash";
import { PolicyEvent } from "./history.repository";

export function verifyHistoryChain(events: PolicyEvent[]): boolean {
  let expectedPreviousHash: string | null = null;

  for (const event of events) {
    if (event.previousHash !== expectedPreviousHash) {
      return false;
    }

    const expectedHash = createHashFromPayload({
      policy_id: event.policyId,
      event_type: event.eventType,
      payload: event.payload,
      previous_hash: event.previousHash,
    });

    if (expectedHash !== event.eventHash) {
      return false;
    }

    expectedPreviousHash = event.eventHash;
  }

  return true;
}
