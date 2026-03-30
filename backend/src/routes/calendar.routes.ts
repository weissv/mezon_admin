// src/routes/calendar.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { createEventSchema, updateEventSchema } from "../schemas/calendar.schema";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errors";

const router = Router();

// GET /api/calendar - List all events (filter by date range)
router.get("/", checkRole(["DEPUTY", "ADMIN", "ACCOUNTANT", "ZAVHOZ", "TEACHER"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const events = await prisma.event.findMany({
      where: {
        ...(startDate && endDate
          ? { date: { gte: new Date(startDate as string), lte: new Date(endDate as string) } }
          : {}),
      },
      include: { group: true },
      orderBy: { date: "asc" },
    });

    return res.json(events);
  } catch (error) {
    logger.error("[calendar] GET /", getErrorMessage(error));
    return res.status(500).json({ message: "Ошибка получения событий" });
  }
});

// GET /api/calendar/groups - Get groups for dropdown
router.get("/groups", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ", "TEACHER"]), async (_req, res) => {
  try {
    const groups = await prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return res.json(groups);
  } catch (error) {
    logger.error("[calendar] GET /groups", getErrorMessage(error));
    return res.status(500).json({ message: "Ошибка получения классов" });
  }
});

// POST /api/calendar - Create new event
router.post("/", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ"]), validate(createEventSchema), async (req, res) => {
  try {
    const { title, date, groupId, organizer, performers } = req.body;

    const event = await prisma.event.create({
      data: {
        title,
        date: new Date(date),
        groupId: groupId ?? null,
        organizer,
        performers: performers ?? [],
      },
      include: { group: true },
    });

    return res.status(201).json(event);
  } catch (error) {
    logger.error("[calendar] POST /", getErrorMessage(error));
    return res.status(500).json({ message: "Ошибка создания события" });
  }
});

// PUT /api/calendar/:id - Update event
router.put("/:id", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ"]), validate(updateEventSchema), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, date, groupId, organizer, performers } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        date: new Date(date),
        groupId: groupId ?? null,
        organizer,
        performers: performers ?? [],
      },
      include: { group: true },
    });

    return res.json(event);
  } catch (error) {
    logger.error("[calendar] PUT /:id", getErrorMessage(error));
    return res.status(500).json({ message: "Ошибка обновления события" });
  }
});

// DELETE /api/calendar/:id - Delete event
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Неверный ID события" });
    }

    await prisma.event.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    logger.error("[calendar] DELETE /:id", getErrorMessage(error));
    return res.status(500).json({ message: "Ошибка удаления события" });
  }
});

export default router;
