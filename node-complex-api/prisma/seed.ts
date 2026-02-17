import { prisma } from "../src/db";
import bcrypt from "bcryptjs";

async function main() {
  const email = "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const hashed = await bcrypt.hash("password123", 12);
  await prisma.user.create({
    data: { email, name: "Admin", password: hashed }
  });
  console.log("Seeded admin@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

