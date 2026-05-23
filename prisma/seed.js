/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminEmail = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log(
      "⚠️  ADMIN_EMAIL/ADMIN_PASSWORD não definidos — pulando criação do admin.",
    );
    console.log(
      "   Para criar o admin, rode: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed",
    );
    return;
  }

  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD deve ter pelo menos 12 caracteres.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", password: passwordHash },
    create: {
      email: adminEmail,
      password: passwordHash,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  console.log(`✅ Admin garantido: ${admin.email}`);
  console.log("🎉 Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
