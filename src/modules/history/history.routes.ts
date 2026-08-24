import { Router } from "express";
import { getHistory } from "./history.controller";

export const historyRouter = Router();

historyRouter.get("/policies/:policyId/history", getHistory);
