import { db } from "../../db/connection";
import { AppError } from "../../shared/errors/app-error";
import { findPolicyById } from "../policies/policy.repository";
import {
  findLedgerByPolicy,
  getPremiumReceivableBalance,
} from "./ledger.repository";

type LedgerTransactionResponse = {
  id: string;
  source_type: string;
  source_id: string;
  created_at: Date;
  entries: {
    id: number;
    account: string;
    entry_type: string;
    amount_cents: number;
  }[];
};

export async function getPolicyLedger(policyId: string) {
  const client = await db.connect();

  try {
    const policy = await findPolicyById(client, policyId);

    if (!policy) {
      throw new AppError("Policy not found", 404);
    }

    const rows = await findLedgerByPolicy(client, policyId);

    const transactions = new Map<string, LedgerTransactionResponse>();

    for (const row of rows) {
      if (!transactions.has(row.transaction_id)) {
        transactions.set(row.transaction_id, {
          id: row.transaction_id,
          source_type: row.source_type,
          source_id: row.source_id,
          created_at: row.created_at,
          entries: [],
        });
      }

      transactions.get(row.transaction_id)!.entries.push({
        id: Number(row.entry_id),
        account: row.account,
        entry_type: row.entry_type,
        amount_cents: Number(row.amount_cents),
      });
    }

    const premiumReceivableBalanceCents = await getPremiumReceivableBalance(
      client,
      policyId,
    );

    return {
      policy_id: policyId,
      currency: policy.currency,
      premium_receivable_balance_cents: premiumReceivableBalanceCents,
      transactions: Array.from(transactions.values()),
    };
  } finally {
    client.release();
  }
}
