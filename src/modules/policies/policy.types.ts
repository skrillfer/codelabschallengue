export type Policy = {
  id: string;
  homeownerId: string;
  status: "active" | "cancelled" | "expired";
  termStart: string;
  termEnd: string;
  annualPremiumCents: number;
  currency: string;
};
