// src/routes/maintenance.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
const router = Router();
import { validate } from "../middleware/validate";
import { createMaintenanceSchema, updateMaintenanceSchema } from "../schemas/maintenance.schema";

router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (_req, res) => {
  const items = await prisma.maintenanceRequest.findMany({
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

router.post("/", checkRole(["DEPUTY", "ADMIN", "TEACHER"]), validate(createMaintenanceSchema), async (req, res) => {
  const data = req.body;
  const created = await prisma.maintenanceRequest.create({
    data: { ...data, requesterId: req.user!.employeeId },
  });
  res.status(201).json(created);
});

router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), validate(updateMaintenanceSchema), async (req, res) => {
  const id = Number(req.params.id);
  const updated = await prisma.maintenanceRequest.update({ where: { id }, data: req.body });
  res.json(updated);
});

// DELETE /api/maintenance/:id - удаление заявки
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    await prisma.maintenanceRequest.delete({ where: { id } });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(204).send();
    }
    throw error;
  }
  return res.status(204).send();
});

// --- CleaningSchedule CRUD ---

// GET /api/maintenance/cleaning - список графиков уборки
router.get("/cleaning", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { branchId } = req.query;
  
  const schedules = await prisma.cleaningSchedule.findMany({
    where: {
      ...(branchId ? { branchId: Number(branchId) } : {}),
    },
    include: {
      branch: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      logs: {
        orderBy: { timestamp: "desc" },
        take: 5,
      },
    },
    orderBy: { area: "asc" },
  });
  
  return res.json(schedules);
});

// POST /api/maintenance/cleaning - создать график уборки
router.post("/cleaning", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { branchId, area, frequency, assignedToId } = req.body;
  
  const schedule = await prisma.cleaningSchedule.create({
    data: {
      branchId,
      area,
      frequency,
      assignedToId: assignedToId || null,
    },
    include: {
      branch: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  
  return res.status(201).json(schedule);
});

// PUT /api/maintenance/cleaning/:id - обновить график
router.put("/cleaning/:id", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { area, frequency, assignedToId } = req.body;
  
  const schedule = await prisma.cleaningSchedule.update({
    where: { id: Number(id) },
    data: { area, frequency, assignedToId },
    include: {
      branch: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  
  return res.json(schedule);
});

// DELETE /api/maintenance/cleaning/:id
router.delete("/cleaning/:id", checkRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  await prisma.cleaningSchedule.delete({ where: { id: Number(id) } });
  return res.status(204).send();
});

// POST /api/maintenance/cleaning/:id/log - отметить выполнение уборки
router.post("/cleaning/:id/log", checkRole(["DEPUTY", "ADMIN", "TEACHER"]), async (req, res) => {
  const { id } = req.params;
  
  const log = await prisma.cleaningLog.create({
    data: {
      scheduleId: Number(id),
    },
  });
  
  return res.status(201).json(log);
});

// --- Equipment CRUD ---

// GET /api/maintenance/equipment - список оборудования
router.get("/equipment", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { branchId } = req.query;
  
  const equipment = await prisma.equipment.findMany({
    where: {
      ...(branchId ? { branchId: Number(branchId) } : {}),
    },
    include: {
      branch: { select: { id: true, name: true } },
    },
    orderBy: { nextCheckup: "asc" },
  });
  
  return res.json(equipment);
});

// POST /api/maintenance/equipment - добавить оборудование
router.post("/equipment", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { branchId, name, location, lastCheckup, nextCheckup } = req.body;
  
  const equipment = await prisma.equipment.create({
    data: {
      branchId,
      name,
      location: location || null,
      lastCheckup: new Date(lastCheckup),
      nextCheckup: new Date(nextCheckup),
    },
    include: {
      branch: { select: { id: true, name: true } },
    },
  });
  
  return res.status(201).json(equipment);
});

// PUT /api/maintenance/equipment/:id - обновить оборудование
router.put("/equipment/:id", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { name, location, lastCheckup, nextCheckup } = req.body;
  
  const equipment = await prisma.equipment.update({
    where: { id: Number(id) },
    data: {
      name,
      location,
      lastCheckup: lastCheckup ? new Date(lastCheckup) : undefined,
      nextCheckup: nextCheckup ? new Date(nextCheckup) : undefined,
    },
    include: {
      branch: { select: { id: true, name: true } },
    },
  });
  
  return res.json(equipment);
});

// DELETE /api/maintenance/equipment/:id
router.delete("/equipment/:id", checkRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  await prisma.equipment.delete({ where: { id: Number(id) } });
  return res.status(204).send();
});

// GET /api/maintenance/equipment/reminders - напоминания о проверках
router.get("/equipment/reminders", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { days = 30 } = req.query;
  
  const upcomingCheckups = await prisma.equipment.findMany({
    where: {
      nextCheckup: {
        lte: new Date(Date.now() + Number(days) * 24 * 3600 * 1000),
      },
    },
    include: {
      branch: { select: { id: true, name: true } },
    },
    orderBy: { nextCheckup: "asc" },
  });
  
  return res.json(upcomingCheckups);
});

export default router;
