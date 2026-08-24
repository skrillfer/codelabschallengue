import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app";
import { db } from "../db/connection";

const endorsementPayload = {
  type: "endorsement.requested",
  idempotency_key: "TEST-END-001",
  effective_date: "2026-07-01",
  new_annual_premium_cents: 144000,
  reason: "Integration test",
};

async function resetTestData() {
  await db.query(`
    DELETE FROM ledger_entries
    WHERE transaction_id IN (
      SELECT id
      FROM ledger_transactions
      WHERE policy_id = 'TEST-POLICY'
    );

    DELETE FROM ledger_transactions
    WHERE policy_id = 'TEST-POLICY';

    DELETE FROM billing_documents
    WHERE policy_id = 'TEST-POLICY';

    DELETE FROM policy_events
    WHERE policy_id = 'TEST-POLICY';

    DELETE FROM idempotency_records
    WHERE idempotency_key LIKE 'TEST-%';

    DELETE FROM policies
    WHERE id = 'TEST-POLICY';

    INSERT INTO policies (
      id,
      homeowner_id,
      status,
      term_start,
      term_end,
      annual_premium_cents,
      currency
    )
    VALUES (
      'TEST-POLICY',
      'TEST-HOMEOWNER',
      'active',
      '2026-01-01',
      '2027-01-01',
      120000,
      'USD'
    );
  `);
}

beforeEach(async () => {
  await resetTestData();
});

afterAll(async () => {
  await resetTestData();

  await db.query(`
    DELETE FROM policies
    WHERE id = 'TEST-POLICY';
  `);
});

describe("POST /api/policies/:policyId/endorsements", () => {
  it("applies an endorsement atomically", async () => {
    const response = await request(app)
      .post("/api/policies/TEST-POLICY/endorsements")
      .send(endorsementPayload);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      policy_id: "TEST-POLICY",
      previous_annual_premium_cents: 120000,
      new_annual_premium_cents: 144000,
      prorated_delta_cents: 12099,
    });

    const policy = await db.query(
      `
        SELECT annual_premium_cents
        FROM policies
        WHERE id = 'TEST-POLICY'
      `,
    );

    expect(Number(policy.rows[0].annual_premium_cents)).toBe(144000);

    const billing = await db.query(
      `
        SELECT COUNT(*)::INTEGER AS count
        FROM billing_documents
        WHERE policy_id = 'TEST-POLICY'
      `,
    );

    expect(billing.rows[0].count).toBe(1);

    const ledger = await db.query(
      `
        SELECT COUNT(*)::INTEGER AS count
        FROM ledger_transactions
        WHERE policy_id = 'TEST-POLICY'
      `,
    );

    expect(ledger.rows[0].count).toBe(1);

    const history = await db.query(
      `
        SELECT COUNT(*)::INTEGER AS count
        FROM policy_events
        WHERE policy_id = 'TEST-POLICY'
      `,
    );

    expect(history.rows[0].count).toBe(1);
  });

  it("returns the original result for the same idempotency key and payload", async () => {
    const firstResponse = await request(app)
      .post("/api/policies/TEST-POLICY/endorsements")
      .send(endorsementPayload);

    const secondResponse = await request(app)
      .post("/api/policies/TEST-POLICY/endorsements")
      .send(endorsementPayload);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);

    expect(secondResponse.body).toEqual(firstResponse.body);

    const billing = await db.query(
      `
        SELECT COUNT(*)::INTEGER AS count
        FROM billing_documents
        WHERE policy_id = 'TEST-POLICY'
      `,
    );

    expect(billing.rows[0].count).toBe(1);

    const ledger = await db.query(
      `
        SELECT COUNT(*)::INTEGER AS count
        FROM ledger_transactions
        WHERE policy_id = 'TEST-POLICY'
      `,
    );

    expect(ledger.rows[0].count).toBe(1);
  });

  it("returns 409 when the idempotency key is reused with another payload", async () => {
    await request(app)
      .post("/api/policies/TEST-POLICY/endorsements")
      .send(endorsementPayload);

    const response = await request(app)
      .post("/api/policies/TEST-POLICY/endorsements")
      .send({
        ...endorsementPayload,
        new_annual_premium_cents: 150000,
      });

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      error: "Idempotency key was already used with a different payload",
    });
  });
  it("rolls back the entire operation when a database write fails", async () => {
    await db.query(
      `
      INSERT INTO billing_documents (
        id,
        policy_id,
        type,
        amount_cents,
        currency,
        status
      )
      VALUES (
        'BILL-TEST-END-001',
        'TEST-POLICY',
        'endorsement_adjustment',
        1,
        'USD',
        'open'
      )
    `,
    );

    const response = await request(app)
      .post("/api/policies/TEST-POLICY/endorsements")
      .send(endorsementPayload);

    expect(response.status).toBe(500);

    const policy = await db.query(
      `
      SELECT annual_premium_cents
      FROM policies
      WHERE id = 'TEST-POLICY'
    `,
    );

    expect(Number(policy.rows[0].annual_premium_cents)).toBe(120000);

    const ledger = await db.query(
      `
      SELECT COUNT(*)::INTEGER AS count
      FROM ledger_transactions
      WHERE policy_id = 'TEST-POLICY'
    `,
    );

    expect(ledger.rows[0].count).toBe(0);

    const history = await db.query(
      `
      SELECT COUNT(*)::INTEGER AS count
      FROM policy_events
      WHERE policy_id = 'TEST-POLICY'
    `,
    );

    expect(history.rows[0].count).toBe(0);

    const idempotency = await db.query(
      `
      SELECT COUNT(*)::INTEGER AS count
      FROM idempotency_records
      WHERE idempotency_key = 'TEST-END-001'
    `,
    );

    expect(idempotency.rows[0].count).toBe(0);
  });
});
