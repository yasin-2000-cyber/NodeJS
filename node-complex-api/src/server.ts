import { app } from "./app";
import { config } from "./config";
import { prisma } from "./db";

async function main() {
  // validate DB connection on startup
  await prisma.$connect();

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`API listening on 0.0.0.0:${config.port} (${config.nodeEnv})`);
  });
}

main().catch((e) => {
  console.error("Startup failed:", e);
  process.exit(1);
});

