import { describe, expect, it } from "vitest";
import { canonicalize, createHashFromPayload } from "./hash";

describe("canonicalize", () => {
  it("produces the same result regardless of object key order", () => {
    const first = {
      amount_cents: 12099,
      currency: "USD",
    };

    const second = {
      currency: "USD",
      amount_cents: 12099,
    };

    expect(canonicalize(first)).toBe(canonicalize(second));
  });

  it("sorts nested object keys", () => {
    const first = {
      payment: {
        amount_cents: 12099,
        currency: "USD",
      },
    };

    const second = {
      payment: {
        currency: "USD",
        amount_cents: 12099,
      },
    };

    expect(canonicalize(first)).toBe(canonicalize(second));
  });
});

describe("createHashFromPayload", () => {
  it("produces the same hash for equivalent payloads", () => {
    const first = {
      policy_id: "POL-1001",
      amount_cents: 12099,
    };

    const second = {
      amount_cents: 12099,
      policy_id: "POL-1001",
    };

    expect(createHashFromPayload(first)).toBe(createHashFromPayload(second));
  });

  it("produces a different hash when the payload changes", () => {
    const original = {
      amount_cents: 12099,
    };

    const modified = {
      amount_cents: 10000,
    };

    expect(createHashFromPayload(original)).not.toBe(
      createHashFromPayload(modified),
    );
  });
});
