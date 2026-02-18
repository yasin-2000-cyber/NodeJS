import express from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  const userId = req.user.sub;

  const byStatus = await query(
    `SELECT status, COUNT(*)::int AS count
     FROM task
     WHERE user_id=$1
     GROUP BY status
     ORDER BY status`,
    [userId]
  );

  const byPriority = await query(
    `SELECT priority, COUNT(*)::int AS count
     FROM task
     WHERE user_id=$1
     GROUP BY priority
     ORDER BY priority`,
    [userId]
  );

  res.json({ byStatus: byStatus.rows, byPriority: byPriority.rows });
});

export default router;

