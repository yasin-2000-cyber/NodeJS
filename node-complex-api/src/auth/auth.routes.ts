import { Router } from "express";
import { registerSchema, loginSchema } from "./auth.validation";
import { registerUser, loginUser } from "./auth.service";

export const authRoutes = Router();

authRoutes.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await registerUser(body.email, body.name, body.password);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body.email, body.password);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

