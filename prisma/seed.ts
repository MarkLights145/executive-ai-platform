import "dotenv/config";
import { prisma } from "../app/lib/db";
import { hash } from "bcryptjs";

// Dev-only seed: creates admin@example.com with password "password".
// Production: disable or remove this seed so no default admin account exists.

async function main() {
  let org = await prisma.organization.findFirst({
    where: { name: "Seed Admin Organization" },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: { name: "Seed Admin Organization" },
    });
    console.log("Created organization:", org.name);
  } else {
    console.log("Organization already exists:", org.name);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: "admin@example.com" },
  });
  const passwordHash = await hash("password", 10);
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
      organizationId: org.id,
    },
  });
  console.log(existingUser ? "User already exists: admin@example.com" : "Created user: admin@example.com");
  console.log("Dev sign-in: admin@example.com / password");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
