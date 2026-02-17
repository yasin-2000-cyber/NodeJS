import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./db";
import { authRoutes } from "./auth/auth.routes";
import { usersRoutes } from "./users/users.routes";
import { projectsRoutes } from "./projects/projects.routes";

export const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors());
app.use(helmet());
app.use(morgan("combined"));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1;`;
    res.json({ status: "ok", database: "connected" });
  } catch (err: any) {
    res.status(500).json({ status: "error", database: "disconnected", error: err?.message || "unknown" });
  }
});

app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/projects", projectsRoutes);

// Simple error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  const status = err?.statusCode || 500;
  res.status(status).json({
    error: err?.message || "Internal Server Error"
  });
});

