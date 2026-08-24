import { z } from "zod";

export const endorsementSchema = z.object({
  type: z.literal("endorsement.requested"),

  idempotency_key: z.string().min(1),

  policy_id: z.string().min(1),

  effective_date: z.iso.date(),

  new_annual_premium_cents: z.number().int().nonnegative(),

  reason: z.string().min(1),
});

export type EndorsementInput = z.infer<typeof endorsementSchema>;
