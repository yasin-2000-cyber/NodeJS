import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../auth/auth.middleware";

export const usersRoutes = Router();

usersRoutes.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, name: true, createdAt: true }
    });

    if (!user) return res.status(404).json({ error: "user not found" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

