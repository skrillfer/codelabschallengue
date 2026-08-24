CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    policy_id TEXT NOT NULL REFERENCES policies(id),

    external_payment_id TEXT NOT NULL UNIQUE,

    amount_cents BIGINT NOT NULL
        CHECK (amount_cents > 0),

    currency CHAR(3) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_policy_id
    ON payments(policy_id);