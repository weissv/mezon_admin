// src/routes/users.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { createUserSchema, updateUserSchema } from "../schemas/user.schema";
import { buildPagination, buildOrderBy, buildWhere } from "../utils/query";

const router = Router();

// GET /api/users - Список всех пользователей
router.get("/", checkRole(["ADMIN"]), async (req, res) => {
  const { skip, take } = buildPagination(req.query);
  const orderBy = buildOrderBy(req.query, ["id", "email", "role", "createdAt"]);
  const where = buildWhere<any>(req.query, ["role"]);

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        email: true,
        role: true,
        employeeId: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({ items, total });
});

// GET /api/users/:id - Получить пользователя по ID
router.get("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      role: true,
      employeeId: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  return res.json(user);
});

// POST /api/users - Создать нового пользователя
router.post("/", checkRole(["ADMIN"]), validate(createUserSchema), async (req, res) => {
  const { email, password, role, employeeId } = req.body;

  // Проверяем, существует ли уже пользователь с таким email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
  }

  // Проверяем, существует ли сотрудник
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    return res.status(400).json({ message: "Сотрудник с указанным ID не найден" });
  }

  // Проверяем, не привязан ли уже другой пользователь к этому сотруднику
  const existingEmployeeUser = await prisma.user.findUnique({ where: { employeeId } });
  if (existingEmployeeUser) {
    return res.status(400).json({ message: "К этому сотруднику уже привязан пользователь" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      employeeId,
    },
    select: {
      id: true,
      email: true,
      role: true,
      employeeId: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
  });

  return res.status(201).json(user);
});

// PUT /api/users/:id - Обновить данные пользователя
router.put("/:id", checkRole(["ADMIN"]), validate(updateUserSchema), async (req, res) => {
  const id = Number(req.params.id);
  const { email, password, role } = req.body;

  // Проверяем, существует ли пользователь
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  // Если меняется email, проверяем уникальность
  if (email && email !== existingUser.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return res.status(400).json({ message: "Логин уже занят" });
    }
  }

  const updateData: any = {};
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      role: true,
      employeeId: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
  });

  return res.json(user);
});

// DELETE /api/users/:id - Удалить пользователя
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);

  // Проверяем, что не удаляем самого себя
  if (req.user!.id === id) {
    return res.status(400).json({ message: "Нельзя удалить свою учётную запись" });
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return res.status(404).json({ message: "Пользователь не найден" });
  }

  await prisma.user.delete({ where: { id } });

  return res.status(204).send();
});

// GET /api/users/employees/available - Сотрудники без привязанных пользователей
router.get("/employees/available", checkRole(["ADMIN"]), async (_req, res) => {
  const employees = await prisma.employee.findMany({
    where: {
      user: null,
      fireDate: null, // Только действующие сотрудники
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      position: true,
    },
    orderBy: { lastName: "asc" },
  });

  return res.json(employees);
});

export default router;
