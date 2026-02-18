import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, zId } from "../util/validate.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const userId = req.user.sub;
  const r = await query(
    `SELECT id, name, created_at
     FROM project
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  res.json({ projects: r.rows });
});

const createSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(120)
  })
});

router.post("/", validate(createSchema), async (req, res) => {
  const userId = req.user.sub;
  const { name } = req.validated.body;

  const r = await query(
    `INSERT INTO project (user_id, name)
     VALUES ($1, $2)
     RETURNING id, name, created_at`,
    [userId, name]
  );
  res.status(201).json({ project: r.rows[0] });
});

router.delete("/:id", validate(z.object({ params: z.object({ id: zId }) })), async (req, res) => {
  const userId = req.user.sub;
  const id = Number(req.validated.params.id);

  const r = await query(
    `DELETE FROM project
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, userId]
  );
  if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

export default router;

