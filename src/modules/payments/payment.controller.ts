import { Request, Response } from "express";
import { ZodError } from "zod";
import { paymentSchema } from "./payment.schema";
import { receivePayment } from "./payment.service";
import { AppError } from "../../shared/error/app.error";

export async function createPayment(req: Request, res: Response) {
  try {
    const input = paymentSchema.parse(req.body);

    const result = await receivePayment(input);

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
