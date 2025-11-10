// src/routes/calendar.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// GET /api/calendar - List all events (filter by date range)
router.get("/", checkRole(["DEPUTY", "ADMIN", "ACCOUNTANT"]), async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const events = await prisma.event.findMany({
    where: {
      ...(startDate && endDate
        ? { date: { gte: new Date(startDate as string), lte: new Date(endDate as string) } }
        : {}),
    },
    orderBy: { date: "asc" },
  });
  
  return res.json(events);
});

// POST /api/calendar - Create new event
router.post("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { title, description, date } = req.body;
  
  const event = await prisma.event.create({
    data: {
      title,
      description: description || null,
      date: new Date(date),
    },
  });
  
  return res.status(201).json(event);
});

// PUT /api/calendar/:id - Update event
router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { title, description, date } = req.body;
  
  const event = await prisma.event.update({
    where: { id: Number(id) },
    data: {
      title,
      description,
      date: new Date(date),
    },
  });
  
  return res.json(event);
});

// DELETE /api/calendar/:id - Delete event
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  
  await prisma.event.delete({
    where: { id: Number(id) },
  });
  
  return res.status(204).send();
});

export default router;
