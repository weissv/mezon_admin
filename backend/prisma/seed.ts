// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");
  
  // 1. Создать филиал
  const branch = await prisma.branch.upsert({
    where: { name: "Главный корпус" },
    update: {},
    create: { name: "Главный корпус", address: "ул. Центральная, 1" },
  });

  // 2. Создать директора
  const directorEmployee = await prisma.employee.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: "Иван",
      lastName: "Иванов",
      position: "Директор",
      rate: 1.0,
      hireDate: new Date(),
      branchId: branch.id,
    },
  });

  // 3. Создать пользователя-директора
  await prisma.user.upsert({
    where: { email: "director@school.erp" },
    update: {},
    create: {
      email: "director@school.erp",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "DIRECTOR",
      employeeId: directorEmployee.id,
    },
  });

  // 4. Создать тестовую группу
  const group = await prisma.group.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Средняя группа",
      branchId: branch.id,
    },
  });

  // 5. Создать тестовые ингредиенты и блюда
  const potato = await prisma.ingredient.upsert({
    where: { name: "Картофель" },
    update: {},
    create: { 
      name: "Картофель", 
      unit: "кг",
      calories: 77,
      protein: 2,
      fat: 0.1,
      carbs: 17,
    },
  });

  const milk = await prisma.ingredient.upsert({
    where: { name: "Молоко" },
    update: {},
    create: { 
      name: "Молоко", 
      unit: "л",
      calories: 64,
      protein: 3.2,
      fat: 3.6,
      carbs: 4.8,
    },
  });

  const porridge = await prisma.dish.upsert({
    where: { name: "Молочная каша" },
    update: {},
    create: {
      name: "Молочная каша",
      category: "Завтрак",
      preparationTime: 20,
    },
  });

  // 6. Связать ингредиенты с блюдом
  await prisma.dishIngredient.upsert({
    where: { dishId_ingredientId: { dishId: porridge.id, ingredientId: milk.id } },
    update: {},
    create: {
      dishId: porridge.id,
      ingredientId: milk.id,
      quantity: 0.2, // 200мл на порцию
    },
  });

  // 7. Создать остатки на складе
  await prisma.inventoryItem.create({
    data: {
      name: "Картофель",
      quantity: 50,
      unit: "кг",
      type: "FOOD",
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      ingredientId: potato.id,
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
