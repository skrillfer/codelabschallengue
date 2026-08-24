CREATE TABLE ledger_transactions (
    id TEXT PRIMARY KEY,

    policy_id TEXT NOT NULL REFERENCES policies(id),

    source_type TEXT NOT NULL
        CHECK (source_type IN ('endorsement', 'payment')),

    source_id TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (source_type, source_id)
);

CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,

    transaction_id TEXT NOT NULL
        REFERENCES ledger_transactions(id),

    account TEXT NOT NULL
        CHECK (
            account IN (
                'cash',
                'premium_receivable',
                'written_premium'
            )
        ),

    entry_type TEXT NOT NULL
        CHECK (entry_type IN ('debit', 'credit')),

    amount_cents BIGINT NOT NULL
        CHECK (amount_cents > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_transactions_policy_id
    ON ledger_transactions(policy_id);

CREATE INDEX idx_ledger_entries_transaction_id
    ON ledger_entries(transaction_id);