CREATE TABLE idempotency_records (
    idempotency_key TEXT PRIMARY KEY,

    operation_type TEXT NOT NULL
        CHECK (operation_type IN ('endorsement', 'payment')),

    request_hash TEXT NOT NULL,

    response_status INTEGER NOT NULL,
    response_body JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);