import { Router } from "express";
import { getLedger } from "./ledger.controller";

export const ledgerRouter = Router();

ledgerRouter.get("/policies/:policyId/ledger", getLedger);
