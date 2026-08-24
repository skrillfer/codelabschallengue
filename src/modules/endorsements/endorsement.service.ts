import { db } from "../../db/connection";
import { createHashFromPayload } from "../../shared/hashing/hash";
import { calculateProratedDelta } from "../../shared/money/proration";
import {
  findPolicyForUpdate,
  updateAnnualPremium,
} from "../policies/policy.repository";
import { createLedgerTransaction } from "../ledger/ledger.repository";
import { appendPolicyEvent } from "../history/history.repository";
import {
  findIdempotencyRecord,
  saveIdempotencyRecord,
} from "../idempotency/idempotency.repository";
import { createBillingDocument } from "./endorsement.repository";
import { EndorsementInput } from "./endorsement.schema";
import { AppError } from "../../shared/errors/app-error";

export async function applyEndorsement(input: EndorsementInput) {
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

    const policy = await findPolicyForUpdate(client, input.policy_id);

    if (!policy) {
      throw new AppError("Policy not found", 404);
    }

    if (policy.status !== "active") {
      throw new AppError("Policy is not active", 400);
    }

    if (
      input.effective_date < policy.termStart ||
      input.effective_date >= policy.termEnd
    ) {
      throw new AppError("Effective date must be within the policy term", 400);
    }

    const proratedDeltaCents = calculateProratedDelta({
      oldAnnualPremiumCents: policy.annualPremiumCents,
      newAnnualPremiumCents: input.new_annual_premium_cents,
      termStart: policy.termStart,
      termEnd: policy.termEnd,
      effectiveDate: input.effective_date,
    });

    if (proratedDeltaCents <= 0) {
      throw new AppError(
        "This implementation only supports positive premium deltas",
        400,
      );
    }

    const billingDocumentId = `BILL-${input.idempotency_key}`;
    const ledgerTransactionId = `LEDGER-${input.idempotency_key}`;

    await updateAnnualPremium(
      client,
      policy.id,
      input.new_annual_premium_cents,
    );

    await createBillingDocument(client, {
      id: billingDocumentId,
      policyId: policy.id,
      amountCents: proratedDeltaCents,
      currency: policy.currency,
    });

    await createLedgerTransaction(client, {
      id: ledgerTransactionId,
      policyId: policy.id,
      sourceType: "endorsement",
      sourceId: input.idempotency_key,
      entries: [
        {
          account: "premium_receivable",
          entryType: "debit",
          amountCents: proratedDeltaCents,
        },
        {
          account: "written_premium",
          entryType: "credit",
          amountCents: proratedDeltaCents,
        },
      ],
    });

    await appendPolicyEvent(client, {
      policyId: policy.id,
      eventType: "endorsement.applied",
      payload: {
        idempotency_key: input.idempotency_key,
        effective_date: input.effective_date,
        previous_annual_premium_cents: policy.annualPremiumCents,
        new_annual_premium_cents: input.new_annual_premium_cents,
        prorated_delta_cents: proratedDeltaCents,
        reason: input.reason,
      },
    });

    const response = {
      policy_id: policy.id,
      endorsement_id: input.idempotency_key,
      previous_annual_premium_cents: policy.annualPremiumCents,
      new_annual_premium_cents: input.new_annual_premium_cents,
      prorated_delta_cents: proratedDeltaCents,
      billing_document_id: billingDocumentId,
    };

    await saveIdempotencyRecord(client, {
      idempotencyKey: input.idempotency_key,
      operationType: "endorsement",
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
