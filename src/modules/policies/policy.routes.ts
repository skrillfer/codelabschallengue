import { Router } from "express";
import { getPolicyById } from "./policy.controller";

export const policyRouter = Router();

policyRouter.get("/policies/:policyId", getPolicyById);
