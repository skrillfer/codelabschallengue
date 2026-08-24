import { z } from "zod";

export const paymentSchema = z.object({
  type: z.literal("payment.received"),
  idempotency_key: z.string().min(1),
  policy_id: z.string().min(1),
  external_payment_id: z.string().min(1),
  amount_cents: z.number().int().positive(),
  currency: z.string().length(3),
  received_at: z.iso.datetime(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
