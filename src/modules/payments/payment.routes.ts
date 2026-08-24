import { Router } from "express";
import { createPayment } from "./payment.controller";

export const paymentRouter = Router();

paymentRouter.post("/policies/:policyId/payments", createPayment);
