import { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error";
import { getPolicyHistory } from "./history.service";

export async function getHistory(req: Request, res: Response) {
  try {
    const result = await getPolicyHistory(req.params.policyId.toString());

    res.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
      });
      return;
    }

    console.error(error);

    res.status(500).json({
      error: "Unexpected error",
    });
  }
}

export async function verifyHistory(req: Request, res: Response) {
  try {
    const result = await getPolicyHistory(req.params.policyId.toString());

    res.json({
      policy_id: result.policy_id,
      chain_valid: result.chain_valid,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
      });
      return;
    }

    console.error(error);

    res.status(500).json({
      error: "Unexpected error",
    });
  }
}
