import express from "express";
import { endorsementRouter } from "./modules/endorsements/endorsement.routes";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api", endorsementRouter);
