import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@webe.local";
  const userEmail = "user@webe.local";

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      role: "ADMIN"
    }
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      passwordHash,
      role: "USER"
    }
  });

  const existing = await prisma.event.findFirst({ where: { title: "Concurrency Workshop" } });
  if (!existing) {
    await prisma.event.create({
      data: {
        title: "Concurrency Workshop",
        description: "Hands-on ACID and locking strategies",
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 26 * 60 * 60 * 1000),
        capacity: 10,
        createdById: admin.id,
        seats: {
          create: Array.from({ length: 10 }, (_, index) => ({ seatNumber: index + 1 }))
        }
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
