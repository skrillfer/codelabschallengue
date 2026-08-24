import { PoolClient } from "pg";

export type IdempotencyRecord = {
  idempotencyKey: string;
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
};

export async function findIdempotencyRecord(
  client: PoolClient,
  idempotencyKey: string,
): Promise<IdempotencyRecord | null> {
  const result = await client.query(
    `
      SELECT
        idempotency_key,
        request_hash,
        response_status,
        response_body
      FROM idempotency_records
      WHERE idempotency_key = $1
    `,
    [idempotencyKey],
  );

  if (!result.rowCount) {
    return null;
  }

  const row = result.rows[0];

  return {
    idempotencyKey: row.idempotency_key,
    requestHash: row.request_hash,
    responseStatus: row.response_status,
    responseBody: row.response_body,
  };
}

type SaveIdempotencyRecordInput = {
  idempotencyKey: string;
  operationType: "endorsement" | "payment";
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
};

export async function saveIdempotencyRecord(
  client: PoolClient,
  input: SaveIdempotencyRecordInput,
): Promise<void> {
  await client.query(
    `
      INSERT INTO idempotency_records (
        idempotency_key,
        operation_type,
        request_hash,
        response_status,
        response_body
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      input.idempotencyKey,
      input.operationType,
      input.requestHash,
      input.responseStatus,
      JSON.stringify(input.responseBody),
    ],
  );
}
