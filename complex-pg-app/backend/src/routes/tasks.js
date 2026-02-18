import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { validate, zId } from "../util/validate.js";

const router = express.Router();
router.use(requireAuth);

const statusEnum = z.enum(["todo", "doing", "done", "blocked"]);
const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);

router.get(
  "/",
  validate(
    z.object({
      query: z.object({
        projectId: zId.optional(),
        status: statusEnum.optional(),
        priority: priorityEnum.optional(),
        q: z.string().max(200).optional(),
        page: z.string().regex(/^\d+$/).optional(),
        pageSize: z.string().regex(/^\d+$/).optional()
      })
    })
  ),
  async (req, res) => {
    const userId = req.user.sub;
    const { projectId, status, priority, q, page, pageSize } = req.validated.query;

    const p = Math.max(1, Number(page || 1));
    const ps = Math.min(50, Math.max(5, Number(pageSize || 10)));
    const offset = (p - 1) * ps;

    const where = [`t.user_id = $1`];
    const params = [userId];
    let idx = params.length;

    if (projectId) {
      params.push(Number(projectId));
      where.push(`t.project_id = $${++idx}`);
    }
    if (status) {
      params.push(status);
      where.push(`t.status = $${++idx}`);
    }
    if (priority) {
      params.push(priority);
      where.push(`t.priority = $${++idx}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(t.title ILIKE $${++idx} OR t.description ILIKE $${idx})`);
    }

    params.push(ps);
    params.push(offset);

    const r = await query(
      `
      SELECT
        t.id, t.project_id, t.title, t.description,
        t.status, t.priority, t.due_date, t.created_at, t.updated_at
      FROM task t
      WHERE ${where.join(" AND ")}
      ORDER BY
        CASE t.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        COALESCE(t.due_date, '9999-12-31')::date,
        t.created_at DESC
      LIMIT $${params.length - 1}
      OFFSET $${params.length}
      `,
      params
    );

    res.json({ tasks: r.rows, page: p, pageSize: ps });
  }
);

router.post(
  "/",
  validate(
    z.object({
      body: z.object({
        projectId: zId,
        title: z.string().min(1).max(160),
        description: z.string().max(4000).optional().default(""),
        status: statusEnum.optional().default("todo"),
        priority: priorityEnum.optional().default("medium"),
        dueDate: z.string().datetime({ offset: true }).optional().nullable()
      })
    })
  ),
  async (req, res) => {
    const userId = req.user.sub;
    const { projectId, title, description, status, priority, dueDate } = req.validated.body;

    // Ensure project belongs to user
    const pr = await query(`SELECT id FROM project WHERE id=$1 AND user_id=$2`, [
      Number(projectId),
      userId
    ]);
    if (!pr.rows[0]) return res.status(404).json({ error: "Project not found" });

    const r = await query(
      `
      INSERT INTO task (user_id, project_id, title, description, status, priority, due_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [userId, Number(projectId), title, description || "", status, priority, dueDate]
    );

    res.status(201).json({ task: r.rows[0] });
  }
);

router.patch(
  "/:id",
  validate(
    z.object({
      params: z.object({ id: zId }),
      body: z
        .object({
          title: z.string().min(1).max(160).optional(),
          description: z.string().max(4000).optional(),
          status: statusEnum.optional(),
          priority: priorityEnum.optional(),
          dueDate: z.string().datetime({ offset: true }).optional().nullable()
        })
        .refine(obj => Object.keys(obj).length > 0, "At least one field is required")
    })
  ),
  async (req, res) => {
    const userId = req.user.sub;
    const id = Number(req.validated.params.id);
    const patch = req.validated.body;

    const fields = [];
    const params = [];
    let i = 0;

    const map = {
      title: "title",
      description: "description",
      status: "status",
      priority: "priority",
      dueDate: "due_date"
    };

    for (const [k, v] of Object.entries(patch)) {
      params.push(v);
      fields.push(`${map[k]} = $${++i}`);
    }

    params.push(userId);
    params.push(id);

    const r = await query(
      `
      UPDATE task
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE user_id = $${++i} AND id = $${++i}
      RETURNING *
      `,
      params
    );

    if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ task: r.rows[0] });
  }
);

router.delete(
  "/:id",
  validate(z.object({ params: z.object({ id: zId }) })),
  async (req, res) => {
    const userId = req.user.sub;
    const id = Number(req.validated.params.id);

    const r = await query(`DELETE FROM task WHERE user_id=$1 AND id=$2 RETURNING id`, [
      userId,
      id
    ]);
    if (!r.rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  }
);

export default router;

