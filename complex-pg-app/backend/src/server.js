import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pool } from "./db.js";

import authRoutes from "./routes/auth.js";
import projectsRoutes from "./routes/projects.js";
import tasksRoutes from "./routes/tasks.js";
import statsRoutes from "./routes/stats.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));

const origin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin, credentials: false }));

app.get("/health", async (_req, res) => {
  try {
    const r = await pool.query("SELECT 1 AS ok");
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/tasks", tasksRoutes);
app.use("/api/stats", statsRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`API listening on :${port}`));

