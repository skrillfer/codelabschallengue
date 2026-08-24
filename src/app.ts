import express from "express";
import { endorsementRouter } from "./modules/endorsements/endorsement.routes";
import { paymentRouter } from "./modules/payments/payment.routes";
import { policyRouter } from "./modules/policies/policy.routes";
import { historyRouter } from "./modules/history/history.routes";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api", endorsementRouter);
app.use("/api", paymentRouter);
app.use("/api", policyRouter);
app.use("/api", historyRouter);
