import { describe, expect, it } from "vitest";
import { createHashFromPayload } from "../../shared/hashing/hash";
import { PolicyEvent } from "./history.repository";
import { verifyHistoryChain } from "./history.validation";

function buildHistory(): PolicyEvent[] {
  const firstPayload = {
    prorated_delta_cents: 12099,
  };

  const firstHash = createHashFromPayload({
    policy_id: "POL-1001",
    event_type: "endorsement.applied",
    payload: firstPayload,
    previous_hash: null,
  });

  const secondPayload = {
    amount_cents: 12099,
  };

  const secondHash = createHashFromPayload({
    policy_id: "POL-1001",
    event_type: "payment.received",
    payload: secondPayload,
    previous_hash: firstHash,
  });

  return [
    {
      id: 1,
      policyId: "POL-1001",
      eventType: "endorsement.applied",
      payload: firstPayload,
      previousHash: null,
      eventHash: firstHash,
      createdAt: new Date(),
    },
    {
      id: 2,
      policyId: "POL-1001",
      eventType: "payment.received",
      payload: secondPayload,
      previousHash: firstHash,
      eventHash: secondHash,
      createdAt: new Date(),
    },
  ];
}

describe("verifyHistoryChain", () => {
  it("accepts a valid history chain", () => {
    const events = buildHistory();

    expect(verifyHistoryChain(events)).toBe(true);
  });

  it("detects a modified event payload", () => {
    const events = buildHistory();

    events[0].payload = {
      prorated_delta_cents: 99999,
    };

    expect(verifyHistoryChain(events)).toBe(false);
  });

  it("detects a broken previous hash", () => {
    const events = buildHistory();

    events[1].previousHash = "invalid-hash";

    expect(verifyHistoryChain(events)).toBe(false);
  });
});
