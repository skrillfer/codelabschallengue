import { db } from "../../db/connection";
import { AppError } from "../../shared/errors/app-error";
import { createHashFromPayload } from "../../shared/hashing/hash";
import { appendPolicyEvent } from "../history/history.repository";
import {
  findIdempotencyRecord,
  saveIdempotencyRecord,
} from "../idempotency/idempotency.repository";
import { createLedgerTransaction } from "../ledger/ledger.repository";
import { findPolicyById } from "../policies/policy.repository";
import { createPayment } from "./payment.repository";
import { PaymentInput } from "./payment.schema";

export async function receivePayment(input: PaymentInput) {
  const client = await db.connect();
  const requestHash = createHashFromPayload(input);

  try {
    await client.query("BEGIN");

    const existingRequest = await findIdempotencyRecord(
      client,
      input.idempotency_key,
    );

    if (existingRequest) {
      if (existingRequest.requestHash !== requestHash) {
        throw new AppError(
          "Idempotency key was already used with a different payload",
          409,
        );
      }

      await client.query("COMMIT");

      return existingRequest.responseBody;
    }

    const policy = await findPolicyById(client, input.policy_id);

    if (!policy) {
      throw new AppError("Policy not found", 404);
    }

    if (input.currency !== policy.currency) {
      throw new AppError(
        "Payment currency does not match policy currency",
        400,
      );
    }

    const paymentId = `PAYMENT-${input.external_payment_id}`;
    const ledgerTransactionId = `LEDGER-${input.idempotency_key}`;

    await createPayment(client, {
      id: paymentId,
      policyId: policy.id,
      externalPaymentId: input.external_payment_id,
      amountCents: input.amount_cents,
      currency: input.currency,
      receivedAt: input.received_at,
    });

    await createLedgerTransaction(client, {
      id: ledgerTransactionId,
      policyId: policy.id,
      sourceType: "payment",
      sourceId: input.external_payment_id,
      entries: [
        {
          account: "cash",
          entryType: "debit",
          amountCents: input.amount_cents,
        },
        {
          account: "premium_receivable",
          entryType: "credit",
          amountCents: input.amount_cents,
        },
      ],
    });

    await appendPolicyEvent(client, {
      policyId: policy.id,
      eventType: "payment.received",
      payload: {
        external_payment_id: input.external_payment_id,
        amount_cents: input.amount_cents,
        currency: input.currency,
        received_at: input.received_at,
      },
    });

    const response = {
      policy_id: policy.id,
      payment_id: paymentId,
      external_payment_id: input.external_payment_id,
      amount_cents: input.amount_cents,
      currency: input.currency,
    };

    await saveIdempotencyRecord(client, {
      idempotencyKey: input.idempotency_key,
      operationType: "payment",
      requestHash,
      responseStatus: 201,
      responseBody: response,
    });

    await client.query("COMMIT");

    return response;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
