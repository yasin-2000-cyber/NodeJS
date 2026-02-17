import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { config } from "../config";

export async function registerUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err: any = new Error("email already exists");
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name, password: hashed },
    select: { id: true, email: true, name: true, createdAt: true }
  });

  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "7d" });
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err: any = new Error("invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err: any = new Error("invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "7d" });
  return {
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
    token
  };
}

