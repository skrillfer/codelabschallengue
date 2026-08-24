import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  applyEndorsement,
  getLedger,
  getPolicy,
  recordPayment,
  verifyHistory,
  type Ledger,
  type Policy,
} from "./api/policy.api";

import "./App.css";

const POLICY_ID = "POL-1001";

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function App() {
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [historyValid, setHistoryValid] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [policyData, ledgerData, historyData] = await Promise.all([
        getPolicy(POLICY_ID),
        getLedger(POLICY_ID),
        verifyHistory(POLICY_ID),
      ]);

      setPolicy(policyData);
      setLedger(ledgerData);
      setHistoryValid(historyData.chain_valid);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleEndorsement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    try {
      setMessage(null);
      setError(null);

      await applyEndorsement(POLICY_ID, {
        idempotency_key: String(form.get("idempotency_key")),
        effective_date: String(form.get("effective_date")),
        new_annual_premium_cents: Number(form.get("new_annual_premium_cents")),
        reason: String(form.get("reason")),
      });

      setMessage("Endorsement applied successfully.");
      event.currentTarget.reset();

      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to apply endorsement",
      );
    }
  }

  async function handlePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    try {
      setMessage(null);
      setError(null);

      await recordPayment(POLICY_ID, {
        idempotency_key: String(form.get("idempotency_key")),
        external_payment_id: String(form.get("external_payment_id")),
        amount_cents: Number(form.get("amount_cents")),
        currency: String(form.get("currency")),
        received_at: new Date(String(form.get("received_at"))).toISOString(),
      });

      setMessage("Payment recorded successfully.");
      event.currentTarget.reset();

      await loadData();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to record payment",
      );
    }
  }

  if (loading && !policy) {
    return <main className="container">Loading policy...</main>;
  }

  if (!policy) {
    return (
      <main className="container">
        <p>{error ?? "Policy not found"}</p>
      </main>
    );
  }

  return (
    <main className="container">
      <header>
        <div>
          <p className="eyebrow">Policy Administration System</p>
          <h1>{policy.id}</h1>
        </div>

        <span className="status">{policy.status}</span>
      </header>

      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      <section className="summary-grid">
        <article className="card">
          <span>Annual premium</span>
          <strong>
            {formatMoney(policy.annual_premium_cents, policy.currency)}
          </strong>
        </article>

        <article className="card">
          <span>Open balance</span>
          <strong>
            {formatMoney(
              policy.premium_receivable_balance_cents,
              policy.currency,
            )}
          </strong>
        </article>

        <article className="card">
          <span>Policy term</span>
          <strong>
            {policy.term.start} → {policy.term.end}
          </strong>
        </article>

        <article className="card">
          <span>History</span>
          <strong>{historyValid ? "Verified" : "Invalid"}</strong>
        </article>
      </section>

      <section className="forms">
        <form className="panel" onSubmit={handleEndorsement}>
          <h2>Apply endorsement</h2>

          <label>
            Idempotency key
            <input name="idempotency_key" placeholder="END-2002" required />
          </label>

          <label>
            Effective date
            <input name="effective_date" type="date" required />
          </label>

          <label>
            New annual premium (cents)
            <input
              name="new_annual_premium_cents"
              type="number"
              min="0"
              required
            />
          </label>

          <label>
            Reason
            <input name="reason" required />
          </label>

          <button type="submit">Apply endorsement</button>
        </form>

        <form className="panel" onSubmit={handlePayment}>
          <h2>Record received payment</h2>

          <label>
            Idempotency key
            <input name="idempotency_key" placeholder="PAY-9002" required />
          </label>

          <label>
            External payment ID
            <input name="external_payment_id" required />
          </label>

          <label>
            Amount (cents)
            <input name="amount_cents" type="number" min="1" required />
          </label>

          <label>
            Currency
            <input
              name="currency"
              defaultValue={policy.currency}
              maxLength={3}
              required
            />
          </label>

          <label>
            Received at
            <input name="received_at" type="datetime-local" required />
          </label>

          <button type="submit">Record payment</button>
        </form>
      </section>

      <section className="panel">
        <h2>Billing documents</h2>

        {policy.billing_documents.map((document) => (
          <div className="row" key={document.id}>
            <div>
              <strong>{document.id}</strong>
              <span>{document.type}</span>
            </div>

            <div>{formatMoney(document.amount_cents, document.currency)}</div>

            <div>{document.status}</div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Payments</h2>

        {policy.payments.map((payment) => (
          <div className="row" key={payment.id}>
            <div>
              <strong>{payment.external_payment_id}</strong>
            </div>

            <div>{formatMoney(payment.amount_cents, payment.currency)}</div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Ledger</h2>

        {ledger?.transactions.map((transaction) => (
          <article className="ledger-transaction" key={transaction.id}>
            <div>
              <strong>{transaction.source_type}</strong>
              <span>{transaction.source_id}</span>
            </div>

            {transaction.entries.map((entry) => (
              <div className="ledger-entry" key={entry.id}>
                <span>{entry.account}</span>
                <span>{entry.entry_type}</span>
                <span>{formatMoney(entry.amount_cents, ledger.currency)}</span>
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
