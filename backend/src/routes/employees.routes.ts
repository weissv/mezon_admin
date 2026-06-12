// src/routes/employees.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { buildPagination, buildOrderBy, buildWhere } from "../utils/query";
import bcrypt from "bcryptjs";
import { validate } from "../middleware/validate";
import { EmployeeService } from "../services/EmployeeService";
import { createEmployeeSchema, updateEmployeeSchema } from "../schemas/employee.schema";
const router = Router();

router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { page, pageSize, sortBy, sortOrder, position, lastName, search } = req.query as any;
  const result = await EmployeeService.findMany({
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
    sortBy,
    sortOrder,
    position,
    lastName,
    search,
  });
  return res.json(result);
});

router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(createEmployeeSchema), async (req, res) => {
  const created = await EmployeeService.create(req.body);
  return res.status(201).json(created);
});

router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), validate(updateEmployeeSchema), async (req, res) => {
  const updated = await EmployeeService.update(Number(req.params.id), req.body);
  return res.json(updated);
});

// PUT /api/employees/:id/archive - архивировать (soft-delete)
router.put("/:id/archive", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  await EmployeeService.update(Number(req.params.id), { status: "ARCHIVED" });
  return res.status(204).send();
});

// DELETE /api/employees/:id - удаление сотрудника
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid employee id" });
  }

  try {
    await EmployeeService.delete(id);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(204).send();
    }
    throw error;
  }

  return res.status(204).send();
});

// GET /api/employees/reminders - напоминания о медосмотрах и аттестации
router.get("/reminders", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { days = 30 } = req.query;
  const futureDate = new Date(Date.now() + Number(days) * 24 * 3600 * 1000);
  
  const [medicalCheckups, attestations] = await Promise.all([
    // Сотрудники, которым скоро нужен медосмотр
    prisma.employee.findMany({
      where: {
        fireDate: null,
        medicalCheckupDate: {
          lte: futureDate,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        medicalCheckupDate: true,
      },
      orderBy: { medicalCheckupDate: "asc" },
    }),
    
    // Сотрудники, которым скоро нужна аттестация
    prisma.employee.findMany({
      where: {
        fireDate: null,
        attestationDate: {
          lte: futureDate,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        attestationDate: true,
      },
      orderBy: { attestationDate: "asc" },
    }),
  ]);
  
  return res.json({
    medicalCheckups: medicalCheckups.map((e: any) => ({
      ...e,
      daysUntil: Math.ceil((new Date(e.medicalCheckupDate!).getTime() - Date.now()) / (24 * 3600 * 1000)),
    })),
    attestations: attestations.map((e: any) => ({
      ...e,
      daysUntil: Math.ceil((new Date(e.attestationDate!).getTime() - Date.now()) / (24 * 3600 * 1000)),
    })),
  });
});

export default router;
