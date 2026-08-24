import { Request, Response } from "express";
import { AppError } from "../../shared/errors/app-error";
import { getPolicy } from "./policy.service";

export async function getPolicyById(req: Request, res: Response) {
  try {
    const policy = await getPolicy(req.params.policyId.toString());

    res.json(policy);
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
