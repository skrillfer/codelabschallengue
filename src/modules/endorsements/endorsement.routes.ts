import { Router } from "express";
import { createEndorsement } from "./endorsement.controller";

export const endorsementRouter = Router();
endorsementRouter.post("/policies/:policyId/endorsements", createEndorsement);
