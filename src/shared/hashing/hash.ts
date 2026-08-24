import { createHash } from "crypto";

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;

    return Object.keys(object)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortValue(object[key]);
        return result;
      }, {});
  }

  return value;
}

export function createHashFromPayload(payload: unknown): string {
  const canonicalPayload = canonicalize(payload);

  return createHash("sha256").update(canonicalPayload).digest("hex");
}
