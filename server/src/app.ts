import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { auditRouter } from "./routes/audit.js";
import { authRouter } from "./routes/auth.js";
import { indicatorsRouter } from "./routes/indicators.js";
import {
  observationsRouter,
  submissionsRouter,
} from "./routes/submissions.js";

export function createApp() {
  const app = express();
  const origin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  app.use(
    cors({
      origin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "dashboard-indikator-bps-api" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/indicators", indicatorsRouter);
  app.use("/api/submissions", submissionsRouter);
  app.use("/api/observations", observationsRouter);
  app.use("/api/audit-logs", auditRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      console.error(err);
      res.status(500).json({
        error: "INTERNAL",
        message: "Terjadi kesalahan pada server.",
      });
    }
  );

  return app;
}
