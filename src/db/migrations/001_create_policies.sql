CREATE TABLE policies (
    id TEXT PRIMARY KEY,
    homeowner_id TEXT NOT NULL,

    status TEXT NOT NULL
        CHECK (status IN ('active', 'cancelled', 'expired')),

    term_start DATE NOT NULL,
    term_end DATE NOT NULL,

    annual_premium_cents BIGINT NOT NULL
        CHECK (annual_premium_cents >= 0),

    currency CHAR(3) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (term_end > term_start)
);