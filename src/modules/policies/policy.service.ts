import { db } from "../../db/connection";
import { AppError } from "../../shared/errors/app-error";
import { findBillingDocumentsByPolicy } from "../endorsements/endorsement.repository";
import { getPremiumReceivableBalance } from "../ledger/ledger.repository";
import { findPaymentsByPolicy } from "../payments/payment.repository";
import { findPolicyById } from "./policy.repository";

export async function getPolicy(policyId: string) {
  const client = await db.connect();

  try {
    const policy = await findPolicyById(client, policyId);

    if (!policy) {
      throw new AppError("Policy not found", 404);
    }

    const [premiumReceivableBalanceCents, billingDocuments, payments] =
      await Promise.all([
        getPremiumReceivableBalance(client, policyId),
        findBillingDocumentsByPolicy(client, policyId),
        findPaymentsByPolicy(client, policyId),
      ]);

    return {
      id: policy.id,
      homeowner_id: policy.homeownerId,
      status: policy.status,

      term: {
        start: policy.termStart,
        end: policy.termEnd,
      },

      annual_premium_cents: policy.annualPremiumCents,
      currency: policy.currency,

      premium_receivable_balance_cents: premiumReceivableBalanceCents,

      billing_documents: billingDocuments,
      payments,
    };
  } finally {
    client.release();
  }
}
