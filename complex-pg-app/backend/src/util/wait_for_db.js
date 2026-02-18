import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS || 30);
  const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 2000);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      console.log(`DB is ready (attempt ${attempt}/${maxAttempts})`);
      return;
    } catch (err) {
      console.log(`DB not ready yet (attempt ${attempt}/${maxAttempts}): ${err.code || err.message}`);
      try { await client.end(); } catch {}
      await sleep(delayMs);
    }
  }

  console.error("DB did not become ready in time");
  process.exit(1);
}

main();

