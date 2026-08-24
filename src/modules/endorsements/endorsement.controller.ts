import { Request, Response } from "express";
import { endorsementSchema } from "./endorsement.schema";
import { applyEndorsement } from "./endorsement.service";
import { AppError } from "../../shared/error/app.error";
import { ZodError } from "zod";

export async function createEndorsement(req: Request, res: Response) {
  try {
    const input = endorsementSchema.parse({
      ...req.body,
      policy_id: req.params.policyId,
    });

    const result = await applyEndorsement(input);

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        error: error.message,
      });
      return;
    }

    if (error instanceof ZodError) {
      res.status(400).json({
        error: "Invalid request",
        details: error.issues,
      });
      return;
    }

    console.error(error);

    res.status(500).json({
      error: "Unexpected error",
    });
  }
}
