import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@caixinhadosnoivos.com.br" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@caixinhadosnoivos.com.br",
      password: adminPassword,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  console.log("✅ Created admin user:", admin.email);

  console.log("\n🎉 Seed completed!");
  console.log("\n🛡️  Admin login: admin@caixinhadosnoivos.com.br");
  console.log("🔑 Admin password: admin123");
  console.log("🔗 Admin panel: http://localhost:3000/admin");
  console.log("\n🔗 Demo page (estática): http://localhost:3000/demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
