const API_URL = "http://localhost:3001/api";

export type Policy = {
  id: string;
  homeowner_id: string;
  status: string;
  term: {
    start: string;
    end: string;
  };
  annual_premium_cents: number;
  currency: string;
  premium_receivable_balance_cents: number;
  billing_documents: {
    id: string;
    type: string;
    amount_cents: number;
    currency: string;
    status: string;
    created_at: string;
  }[];
  payments: {
    id: string;
    external_payment_id: string;
    amount_cents: number;
    currency: string;
    received_at: string;
  }[];
};

export type Ledger = {
  policy_id: string;
  currency: string;
  premium_receivable_balance_cents: number;
  transactions: {
    id: string;
    source_type: string;
    source_id: string;
    created_at: string;
    entries: {
      id: number;
      account: string;
      entry_type: string;
      amount_cents: number;
    }[];
  }[];
};

export type HistoryVerification = {
  policy_id: string;
  chain_valid: boolean;
};

export async function getPolicy(policyId: string): Promise<Policy> {
  const response = await fetch(`${API_URL}/policies/${policyId}`);

  if (!response.ok) {
    throw new Error("Unable to load policy");
  }

  return response.json();
}

export async function getLedger(policyId: string): Promise<Ledger> {
  const response = await fetch(`${API_URL}/policies/${policyId}/ledger`);

  if (!response.ok) {
    throw new Error("Unable to load ledger");
  }

  return response.json();
}

export async function verifyHistory(
  policyId: string,
): Promise<HistoryVerification> {
  const response = await fetch(
    `${API_URL}/policies/${policyId}/history/verify`,
  );

  if (!response.ok) {
    throw new Error("Unable to verify history");
  }

  return response.json();
}

export async function applyEndorsement(
  policyId: string,
  input: {
    idempotency_key: string;
    effective_date: string;
    new_annual_premium_cents: number;
    reason: string;
  },
) {
  const response = await fetch(`${API_URL}/policies/${policyId}/endorsements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "endorsement.requested",
      ...input,
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to apply endorsement");
  }

  return body;
}

export async function recordPayment(
  policyId: string,
  input: {
    idempotency_key: string;
    external_payment_id: string;
    amount_cents: number;
    currency: string;
    received_at: string;
  },
) {
  const response = await fetch(`${API_URL}/policies/${policyId}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "payment.received",
      ...input,
    }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Unable to record payment");
  }

  return body;
}
