CREATE TABLE policy_events (
    id BIGSERIAL PRIMARY KEY,

    policy_id TEXT NOT NULL REFERENCES policies(id),

    event_type TEXT NOT NULL,

    payload JSONB NOT NULL,

    previous_hash TEXT,
    event_hash TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_events_policy_id
    ON policy_events(policy_id, id);