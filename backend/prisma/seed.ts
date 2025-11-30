// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const resolveSeedPassword = (envKey: string, label: string) => {
  const envValue = process.env[envKey];
  if (envValue && envValue.length >= 12) {
    return envValue;
  }
  const generated = randomBytes(12).toString("base64url");
  console.warn(
    `[seed] Environment variable ${envKey} is not set. Generated a temporary password for ${label}: ${generated}`
  );
  console.warn(`[seed] Please store this password securely or rerun seeding with ${envKey} defined.`);
  return generated;
};

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
  const directorPasswordHash = await bcrypt.hash(resolveSeedPassword("SEED_DIRECTOR_PASSWORD", "director"), 10);
  await prisma.user.upsert({
    where: { employeeId: directorEmployee.id },
    update: {
      email: "director",
      passwordHash: directorPasswordHash,
      role: "DIRECTOR",
    },
    create: {
      email: "director",
      passwordHash: directorPasswordHash,
      role: "DIRECTOR",
      employeeId: directorEmployee.id,
    },
  });

  // 3.1. Создать администратора Izumi
  const izumiEmployee = await prisma.employee.upsert({
    where: { id: 999 },
    update: {},
    create: {
      id: 999,
      firstName: "Izumi",
      lastName: "Amano",
      position: "Администратор",
      rate: 1.0,
      hireDate: new Date(),
      branchId: branch.id,
    },
  });

  // Пароль для izumi: 8p09VhXW (или из переменной окружения)
  const izumiPassword = process.env.SEED_ADMIN_PASSWORD || "8p09VhXW";
  const izumiPasswordHash = await bcrypt.hash(izumiPassword, 10);
  await prisma.user.upsert({
    where: { employeeId: izumiEmployee.id },
    update: {
      email: "izumi",
      passwordHash: izumiPasswordHash,
      role: "ADMIN",
    },
    create: {
      email: "izumi",
      passwordHash: izumiPasswordHash,
      role: "ADMIN",
      employeeId: izumiEmployee.id,
    },
  });
  console.log("Created users: director, izumi (password: 8p09VhXW)");

  // 4. Создать 11 классов (1-11)
  const classNames = [
    "1 класс", "2 класс", "3 класс", "4 класс", "5 класс",
    "6 класс", "7 класс", "8 класс", "9 класс", "10 класс", "11 класс"
  ];
  
  for (let i = 0; i < classNames.length; i++) {
    await prisma.group.upsert({
      where: { name_branchId: { name: classNames[i], branchId: branch.id } },
      update: {},
      create: {
        name: classNames[i],
        branchId: branch.id,
      },
    });
  }
  console.log("Created 11 classes (1-11 класс)");

  // 4.1. Удалить старую "Средняя группа" если она существует и не используется
  try {
    const oldGroup = await prisma.group.findFirst({ where: { name: "Средняя группа" } });
    if (oldGroup) {
      const childrenInOldGroup = await prisma.child.count({ where: { groupId: oldGroup.id } });
      if (childrenInOldGroup === 0) {
        await prisma.group.delete({ where: { id: oldGroup.id } });
        console.log("Deleted old 'Средняя группа'");
      }
    }
  } catch (e) {
    // Игнорируем ошибки при удалении
  }

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
  const existingInventory = await prisma.inventoryItem.findFirst({ where: { ingredientId: potato.id } });
  if (existingInventory) {
    await prisma.inventoryItem.update({
      where: { id: existingInventory.id },
      data: {
        name: "Картофель",
        quantity: 50,
        unit: "кг",
        type: "FOOD",
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        ingredientId: potato.id,
      },
    });
  } else {
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
  }

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
