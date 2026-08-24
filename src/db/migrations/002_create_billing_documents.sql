CREATE TABLE billing_documents (
    id TEXT PRIMARY KEY,
    policy_id TEXT NOT NULL REFERENCES policies(id),

    type TEXT NOT NULL
        CHECK (type IN ('endorsement_adjustment')),

    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,

    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'paid')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_documents_policy_id
    ON billing_documents(policy_id);