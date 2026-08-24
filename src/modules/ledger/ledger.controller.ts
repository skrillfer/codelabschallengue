import { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error";
import { getPolicyLedger } from "./ledger.service";

export async function getLedger(req: Request, res: Response) {
  try {
    const ledger = await getPolicyLedger(req.params.policyId.toString());

    res.json(ledger);
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
