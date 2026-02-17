import dotenv from "dotenv";
dotenv.config();

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: mustGet("JWT_SECRET"),
  databaseUrl: mustGet("DATABASE_URL")
};

