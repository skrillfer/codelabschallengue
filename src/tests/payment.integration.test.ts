import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app";
import { db } from "../db/connection";

const paymentPayload = {
  type: "payment.received",
  idempotency_key: "TEST-PAY-001",
  external_payment_id: "TEST-EXTERNAL-PAY-001",
  amount_cents: 12099,
  currency: "USD",
  received_at: "2026-07-03T18:30:00Z",
};

async function resetTestData() {
  await db.query(`
    DELETE FROM ledger_entries
    WHERE transaction_id IN (
      SELECT id
      FROM ledger_transactions
      WHERE policy_id = 'TEST-PAYMENT-POLICY'
    );

    DELETE FROM ledger_transactions
    WHERE policy_id = 'TEST-PAYMENT-POLICY';

    DELETE FROM payments
    WHERE policy_id = 'TEST-PAYMENT-POLICY';

    DELETE FROM policy_events
    WHERE policy_id = 'TEST-PAYMENT-POLICY';

    DELETE FROM idempotency_records
    WHERE idempotency_key LIKE 'TEST-PAY-%';

    DELETE FROM policies
    WHERE id = 'TEST-PAYMENT-POLICY';

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
      'TEST-PAYMENT-POLICY',
      'TEST-HOMEOWNER',
      'active',
      '2026-01-01',
      '2027-01-01',
      144000,
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
    WHERE id = 'TEST-PAYMENT-POLICY';
  `);
});

describe("POST /api/payments", () => {
  it("records a payment and its balanced ledger entries", async () => {
    const response = await request(app)
      .post("/api/policies/TEST-PAYMENT-POLICY/payments")
      .send(paymentPayload);

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      policy_id: "TEST-PAYMENT-POLICY",
      external_payment_id: "TEST-EXTERNAL-PAY-001",
      amount_cents: 12099,
      currency: "USD",
    });

    const payments = await db.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM payments
      WHERE policy_id = 'TEST-PAYMENT-POLICY'
    `);

    expect(payments.rows[0].count).toBe(1);

    const entries = await db.query(`
      SELECT
        le.account,
        le.entry_type,
        le.amount_cents
      FROM ledger_entries le
      INNER JOIN ledger_transactions lt
        ON lt.id = le.transaction_id
      WHERE lt.policy_id = 'TEST-PAYMENT-POLICY'
      ORDER BY le.id
    `);

    expect(entries.rows).toHaveLength(2);

    expect(entries.rows[0]).toMatchObject({
      account: "cash",
      entry_type: "debit",
    });

    expect(Number(entries.rows[0].amount_cents)).toBe(12099);

    expect(entries.rows[1]).toMatchObject({
      account: "premium_receivable",
      entry_type: "credit",
    });

    expect(Number(entries.rows[1].amount_cents)).toBe(12099);
  });

  it("does not duplicate a retried payment", async () => {
    const firstResponse = await request(app)
      .post("/api/policies/TEST-PAYMENT-POLICY/payments")
      .send(paymentPayload);

    const secondResponse = await request(app)
      .post("/api/policies/TEST-PAYMENT-POLICY/payments")
      .send(paymentPayload);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body).toEqual(firstResponse.body);

    const payments = await db.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM payments
      WHERE policy_id = 'TEST-PAYMENT-POLICY'
    `);

    expect(payments.rows[0].count).toBe(1);

    const transactions = await db.query(`
      SELECT COUNT(*)::INTEGER AS count
      FROM ledger_transactions
      WHERE policy_id = 'TEST-PAYMENT-POLICY'
    `);

    expect(transactions.rows[0].count).toBe(1);
  });

  it("returns 409 when the key is reused with another payment payload", async () => {
    await request(app)
      .post("/api/policies/TEST-PAYMENT-POLICY/payments")
      .send(paymentPayload);

    const response = await request(app)
      .post("/api/policies/TEST-PAYMENT-POLICY/payments")
      .send({
        ...paymentPayload,
        amount_cents: 10000,
      });

    expect(response.status).toBe(409);

    expect(response.body).toEqual({
      error: "Idempotency key was already used with a different payload",
    });
  });
  it("rejects a payment with a different currency", async () => {
    const response = await request(app)
      .post("/api/policies/TEST-PAYMENT-POLICY/payments")
      .send({
        ...paymentPayload,
        idempotency_key: "TEST-PAY-CURRENCY",
        external_payment_id: "TEST-EXTERNAL-PAY-CURRENCY",
        currency: "GTQ",
      });

    expect(response.status).toBe(400);

    expect(response.body).toEqual({
      error: "Payment currency does not match policy currency",
    });

    const payments = await db.query(`
    SELECT COUNT(*)::INTEGER AS count
    FROM payments
    WHERE policy_id = 'TEST-PAYMENT-POLICY'
  `);

    expect(payments.rows[0].count).toBe(0);

    const ledger = await db.query(`
    SELECT COUNT(*)::INTEGER AS count
    FROM ledger_transactions
    WHERE policy_id = 'TEST-PAYMENT-POLICY'
  `);

    expect(ledger.rows[0].count).toBe(0);
  });
});
