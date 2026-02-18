import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlDir = path.resolve(__dirname, "../../sql");

async function main() {
  const files = fs
    .readdirSync(sqlDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No .sql migrations found in", sqlDir);
    process.exit(0);
  }

  for (const f of files) {
    const full = path.join(sqlDir, f);
    const sql = fs.readFileSync(full, "utf8");
    console.log("Running migration:", f);
    await pool.query(sql);
  }

  console.log("Migrations complete.");
  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

