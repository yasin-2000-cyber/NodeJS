import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db.js";
import { validate } from "../util/validate.js";

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(200)
  })
});

router.post("/register", validate(registerSchema), async (req, res) => {
  const { email, password } = req.validated.body;
  const hash = await bcrypt.hash(password, 12);

  try {
    const r = await query(
      `INSERT INTO app_user (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [email.toLowerCase(), hash]
    );
    return res.status(201).json({ user: r.rows[0] });
  } catch (e) {
    // unique violation
    if (e?.code === "23505") return res.status(409).json({ error: "Email already exists" });
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated.body;

  const r = await query(
    `SELECT id, email, password_hash FROM app_user WHERE email = $1`,
    [email.toLowerCase()]
  );
  if (!r.rows[0]) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, r.rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { sub: r.rows[0].id, email: r.rows[0].email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({ token });
});

export default router;

