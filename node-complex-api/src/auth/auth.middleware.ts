import jwt from "jsonwebtoken";
import { config } from "../config";

export type AuthRequest = any & { userId?: string };

export function requireAuth(req: AuthRequest, _res: any, next: any) {
  const header = req.headers["authorization"] || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    const err: any = new Error("missing or invalid Authorization header");
    err.statusCode = 401;
    return next(err);
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.userId = payload.sub;
    return next();
  } catch {
    const err: any = new Error("invalid token");
    err.statusCode = 401;
    return next(err);
  }
}

