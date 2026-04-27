import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./openapi.json" with { type: "json" };
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { eventsRouter } from "./routes/events.js";
import { organizerRouter } from "./routes/organizer.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
  app.get("/openapi.json", (_req, res) => {
    res.json(openapiSpec);
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/organizer", organizerRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Erreur serveur" });
    },
  );

  return app;
}
