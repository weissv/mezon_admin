// src/routes/clubs.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { createClubSchema, enrollClubSchema } from "../schemas/club.schema";

const router = Router();

// GET /api/clubs
router.get("/", checkRole(["DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
  const isTeacher = req.user!.role === "TEACHER";
  const where = isTeacher ? { teacherId: req.user!.employeeId } : {};
  const clubs = await prisma.club.findMany({ where, include: { teacher: true } });
  return res.json(clubs);
});

// GET /api/clubs/:id
router.get("/:id", checkRole(["DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
  const id = Number(req.params.id);
  const club = await prisma.club.findUnique({ where: { id } });
  if (!club) return res.status(404).json({ message: "Not found" });
  if (req.user!.role === "TEACHER" && club.teacherId !== req.user!.employeeId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return res.json(club);
});
router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(createClubSchema), async (req, res) => {
  const club = await prisma.club.create({ data: req.body });
  res.status(201).json(club);
});

router.post("/:id/enroll", checkRole(["DEPUTY", "ADMIN"]), validate(enrollClubSchema), async (req, res) => {  const clubId = Number(req.params.id);
  const { childId } = req.body as { childId: number };
  // Валидация вместимости
  const [club, activeCount] = await Promise.all([
    prisma.club.findUnique({ where: { id: clubId } }),
    prisma.clubEnrollment.count({ where: { clubId, status: "ACTIVE" } }),
  ]);
  if (!club) return res.status(404).json({ message: "Club not found" });
  if (activeCount >= club.maxStudents) {
    // Добавляем в лист ожидания, если заполнено
    const enrollment = await prisma.clubEnrollment.upsert({
      where: { childId_clubId: { childId, clubId } },
      update: { status: "WAITING_LIST" },
      create: { childId, clubId, status: "WAITING_LIST" },
    });
    return res.status(201).json({ enrollment, message: "Added to waiting list" });
  }
  const enrollment = await prisma.clubEnrollment.upsert({
    where: { childId_clubId: { childId, clubId } },
    update: { status: "ACTIVE" },
    create: { childId, clubId, status: "ACTIVE" },
  });
  return res.status(201).json({ enrollment, message: "Enrolled" });
});

export default router;
