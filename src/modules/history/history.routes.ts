import { Router } from "express";
import { getHistory, verifyHistory } from "./history.controller";

export const historyRouter = Router();

historyRouter.get("/policies/:policyId/history", getHistory);
historyRouter.get("/policies/:policyId/history/verify", verifyHistory);
