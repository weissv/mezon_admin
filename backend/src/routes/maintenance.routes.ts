// src/routes/maintenance.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
const router = Router();
import { validate } from "../middleware/validate";
import { createMaintenanceSchema, updateMaintenanceSchema } from "../schemas/maintenance.schema";

router.get("/", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
  const items = await prisma.maintenanceRequest.findMany({
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

router.post("/", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"]), validate(createMaintenanceSchema), async (req, res) => {
  const data = req.body;
  const created = await prisma.maintenanceRequest.create({
    data: { ...data, requesterId: req.user!.employeeId },
  });
  res.status(201).json(created);
});

router.put("/:id", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), validate(updateMaintenanceSchema), async (req, res) => {
  const id = Number(req.params.id);
  const updated = await prisma.maintenanceRequest.update({ where: { id }, data: req.body });
  res.json(updated);
});

// DELETE /api/maintenance/:id - удаление заявки
router.delete("/:id", checkRole(["DIRECTOR", "ADMIN"]), async (req, res) => {
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
router.get("/cleaning", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
  const schedules = await prisma.cleaningSchedule.findMany({
    include: {
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
router.post("/cleaning", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { area, frequency, assignedToId } = req.body;
  
  const schedule = await prisma.cleaningSchedule.create({
    data: {
      area,
      frequency,
      assignedToId: assignedToId || null,
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  
  return res.status(201).json(schedule);
});

// PUT /api/maintenance/cleaning/:id - обновить график
router.put("/cleaning/:id", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { area, frequency, assignedToId } = req.body;
  
  const schedule = await prisma.cleaningSchedule.update({
    where: { id: Number(id) },
    data: { area, frequency, assignedToId },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  
  return res.json(schedule);
});

// DELETE /api/maintenance/cleaning/:id
router.delete("/cleaning/:id", checkRole(["DIRECTOR", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  await prisma.cleaningSchedule.delete({ where: { id: Number(id) } });
  return res.status(204).send();
});

// POST /api/maintenance/cleaning/:id/log - отметить выполнение уборки
router.post("/cleaning/:id/log", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"]), async (req, res) => {
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
router.get("/equipment", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (_req, res) => {
  const equipment = await prisma.equipment.findMany({
    orderBy: { nextCheckup: "asc" },
  });
  
  return res.json(equipment);
});

// POST /api/maintenance/equipment - добавить оборудование
router.post("/equipment", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { name, location, lastCheckup, nextCheckup } = req.body;
  
  const equipment = await prisma.equipment.create({
    data: {
      name,
      location: location || null,
      lastCheckup: new Date(lastCheckup),
      nextCheckup: new Date(nextCheckup),
    },
  });
  
  return res.status(201).json(equipment);
});

// PUT /api/maintenance/equipment/:id - обновить оборудование
router.put("/equipment/:id", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
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
  });
  
  return res.json(equipment);
});

// DELETE /api/maintenance/equipment/:id
router.delete("/equipment/:id", checkRole(["DIRECTOR", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  await prisma.equipment.delete({ where: { id: Number(id) } });
  return res.status(204).send();
});

// GET /api/maintenance/equipment/reminders - напоминания о проверках
router.get("/equipment/reminders", checkRole(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
  const { days = 30 } = req.query;
  
  const upcomingCheckups = await prisma.equipment.findMany({
    where: {
      nextCheckup: {
        lte: new Date(Date.now() + Number(days) * 24 * 3600 * 1000),
      },
    },
    orderBy: { nextCheckup: "asc" },
  });
  
  return res.json(upcomingCheckups);
});

export default router;
