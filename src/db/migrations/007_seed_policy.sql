INSERT INTO policies (
    id,
    homeowner_id,
    status,
    term_start,
    term_end,
    annual_premium_cents,
    currency
)
VALUES (
    'POL-1001',
    'HOME-204',
    'active',
    '2026-01-01',
    '2027-01-01',
    120000,
    'USD'
)
ON CONFLICT (id) DO NOTHING;