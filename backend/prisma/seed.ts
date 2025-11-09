// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");
  const branch = await prisma.branch.upsert({
    where: { name: "Главный корпус" },
    update: {},
    create: { name: "Главный корпус", address: "ул. Центральная, 1" },
  });

  const directorEmployee = await prisma.employee.create({
    data: {
      firstName: "Иван",
      lastName: "Иванов",
      position: "Директор",
      rate: 1.0,
      hireDate: new Date(),
      branchId: branch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "director@school.erp" }, // Уникальное поле для поиска
    update: {}, // Что делать, если он найден (здесь - ничего)
    create: {
      email: "director@school.erp",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "DIRECTOR",
      employeeId: directorEmployee.id,
    },
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
