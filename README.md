# Policy Administration Challenge

A small policy administration system built with Node.js, TypeScript, PostgreSQL, and React.

The project focuses on backend correctness for policy endorsements, billing adjustments, external payment ingestion, idempotency, double-entry accounting, and tamper-evident policy history.

## Tech Stack

### Backend

- Node.js
- TypeScript
- Express
- PostgreSQL
- Vitest

### Frontend

- React
- TypeScript
- Vite

### Local Infrastructure

- Docker
- Docker Compose
- PostgreSQL 17

## Main Features

- Policy administration
- Mid-term policy endorsements
- Prorated premium adjustments
- Billing adjustment documents
- External payment ingestion
- Idempotent financial operations
- Double-entry ledger
- Transactional database writes
- Tamper-evident event history using SHA-256 hash chaining
- Policy financial summary
- Minimal React administration interface

## Project Structure

The backend is the main part of the challenge and is located at the project root.

The React application is isolated inside the `web` directory.

```text
.
├── src/
│   ├── db/
│   │   └── migrations/
│   ├── modules/
│   │   ├── endorsements/
│   │   ├── history/
│   │   ├── idempotency/
│   │   ├── ledger/
│   │   ├── payments/
│   │   └── policies/
│   ├── shared/
│   │   ├── errors/
│   │   ├── hashing/
│   │   └── money/
│   ├── tests/
│   ├── app.ts
│   └── server.ts
│
├── web/
│   └── src/
│
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

## Core Workflow

### Applying an Endorsement

An endorsement changes the annual premium starting from an effective date.

The operation is executed inside a PostgreSQL transaction.

The flow is:

1. Validate the request and idempotency key.
2. Lock the policy while the premium is being changed.
3. Validate the policy and endorsement dates.
4. Calculate the prorated premium difference.
5. Update the annual premium.
6. Create a billing adjustment document.
7. Create balanced ledger entries.
8. Append an event to the policy history.
9. Store the idempotency result.
10. Commit the transaction.

If any database operation fails, the complete transaction is rolled back.

### Payment Ingestion

Payments are assumed to have already happened in an external payment system.

This API does not process the payment itself. It receives and records the payment information and creates the corresponding accounting effects.

The flow is:

1. Validate the request and idempotency key.
2. Load and validate the policy.
3. Validate that payment and policy currencies match.
4. Store the received payment.
5. Create balanced ledger entries.
6. Append the payment event to policy history.
7. Store the idempotency result.
8. Commit the transaction.

## Premium Proration

When an endorsement changes the annual premium, only the remaining part of the policy term is charged or credited.

The calculation uses the premium difference and the remaining portion of the policy term.

Money is represented using integer cents instead of floating-point monetary values.

For example:

```text
Previous annual premium: $1,440.00
New annual premium:      $1,500.00
Annual difference:          $60.00
Effective date:          2026-10-01

Prorated adjustment:       $15.12
```

The backend stores the result as:

```text
1512 cents
```

## Idempotency

Endorsement and payment operations use an `idempotency_key`.

The application creates a deterministic hash from the request payload and stores it together with the result of the operation.

If the same key is sent again with the same payload, the original response is returned without creating duplicate financial records.

If the same key is reused with a different payload, the API returns:

```text
409 Conflict
```

This protects the system from duplicated financial effects caused by retries, network problems, or repeated user actions.

## Double-Entry Accounting

Every financial operation creates balanced debit and credit entries.

### Endorsement Example

For a positive premium adjustment:

```text
Debit   premium_receivable
Credit  written_premium
```

### Payment Example

When a payment is received:

```text
Debit   cash
Credit  premium_receivable
```

For example:

```text
Endorsement
DR premium_receivable    $15.12
CR written_premium       $15.12

Payment
DR cash                  $15.12
CR premium_receivable    $15.12
```

The resulting premium receivable balance is:

```text
$0.00
```

Ledger validation ensures that total debits and total credits are equal.

## Tamper-Evident Policy History

Important policy operations are stored as events.

Each event contains:

- its payload
- the previous event hash
- its own SHA-256 hash

This creates a hash chain:

```text
Event 1
   ↓ hash
Event 2
   ↓ hash
Event 3
```

If a historical event is modified directly in the database, the calculated hash no longer matches the stored hash and the chain becomes invalid.

The API provides a verification endpoint to check the integrity of the policy history.

## Running the Project

### Requirements

- Node.js
- npm
- Docker
- Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/skrillfer/codelabschallengue.git
cd codelabschallengue
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

The Docker configuration starts PostgreSQL 17 using:

```text
Database: baselabs_policy
User:     postgres
Password: postgres
Port:     5432
```

### 3. Install backend dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file based on `.env.example`.

```env
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=baselabs_policy
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

### 5. Run database migrations

```bash
npm run db:migrate
```

The migrations create the required tables and seed the sample policy used by the project.

### 6. Start the backend

```bash
npm run dev
```

The API runs at:

```text
http://localhost:3001
```

### 7. Start the frontend

Open another terminal:

```bash
cd web
npm install
npm run dev
```

Vite will provide the local frontend URL, normally:

```text
http://localhost:5173
```

## Sample Policy

The database migrations include a sample active policy:

```text
Policy ID:       POL-1001
Homeowner ID:    HOME-204
Status:          active
Term start:      2026-01-01
Term end:        2027-01-01
Currency:        USD
```

This policy can be used to explore the API and frontend.

## API Endpoints

### Apply an endorsement

```http
POST /api/policies/:policyId/endorsements
```

### Record an external payment

```http
POST /api/policies/:policyId/payments
```

### Get policy financial state

```http
GET /api/policies/:policyId
```

### Get policy ledger

```http
GET /api/policies/:policyId/ledger
```

### Get policy event history

```http
GET /api/policies/:policyId/history
```

### Verify policy history

```http
GET /api/policies/:policyId/history/verify
```

## Tests

Run the complete test suite with:

```bash
npm test
```

The tests cover:

- premium proration
- financial rounding
- canonical payload hashing
- deterministic request hashing
- double-entry ledger validation
- policy history validation
- endorsement integration
- payment integration
- idempotent retries
- conflicting idempotency payloads
- wrong payment currency
- transaction rollback

Current test suite:

```text
6 test files passed
21 tests passed
```

The rollback integration test intentionally generates a database constraint error to verify that a partially completed endorsement is completely rolled back.

## Production Builds

### Backend

```bash
npm run build
```

The compiled backend is generated in `dist/`.

It can be executed with:

```bash
npm start
```

### Frontend

```bash
cd web
npm run build
```

## Main Design Decisions

### Integer Cents for Money

Financial values are stored as integer cents.

This avoids using floating-point values as the persistent representation of money.

The frontend accepts user-friendly dollar values and converts them to cents before sending them to the backend.

### Database Transactions

Endorsements and payments affect multiple financial records.

These writes must succeed or fail together, so each operation is executed inside a database transaction.

### Policy Row Locking

An endorsement modifies the policy premium.

The policy row is loaded using `FOR UPDATE` during the transaction to protect the premium change from concurrent modifications.

### Append-Only Ledger

Financial effects are represented as new ledger transactions and entries instead of modifying previous accounting entries.

This provides a clearer financial audit trail.

### Idempotent Commands

Financial operations may be retried.

Persisting idempotency results prevents a retry from producing the same financial effect twice.

### Tamper-Evident History

Policy history uses hash chaining so modifications to previously stored events can be detected.

### Minimal Frontend

The frontend intentionally focuses on demonstrating the required workflows instead of implementing a complete insurance administration product.

It provides:

- policy financial summary
- endorsement submission
- payment ingestion
- billing document visibility
- payment history
- ledger visibility
- event-chain verification

## Current Scope and Future Improvements

This implementation focuses on the core requirements of the challenge.

One intentional limitation is payment allocation.

Payments currently affect the policy-level premium receivable balance, but they are not allocated to individual billing documents. Because of this, a billing document can remain with an `open` status even when the policy-level receivable balance reaches zero.

In a production system, the next step would be to introduce payment allocations and calculate each billing document's remaining balance and status.

Other possible improvements include:

- authentication and authorization
- pagination for ledger and history
- structured application logging
- API-level rate limiting
- additional concurrency tests
- payment allocation
- CI pipeline
- production deployment configuration

## AI Usage

AI tools were used as a development assistant during the challenge, mainly to:

- discuss unfamiliar insurance-domain concepts
- review requirements
- review implementation decisions
- identify edge cases
- assist with documentation

The implementation decisions were validated through manual testing, SQL inspection, automated tests, and end-to-end verification.

All submitted code was reviewed and can be explained and modified during the technical discussion.
