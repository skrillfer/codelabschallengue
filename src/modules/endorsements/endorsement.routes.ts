import { Router } from "express";
import { createEndorsement } from "./endorsement.controller";

export const endorsementRouter = Router();
console.log("Endorsement routes loaded");
endorsementRouter.post("/policies/:policyId/endorsements", createEndorsement);
