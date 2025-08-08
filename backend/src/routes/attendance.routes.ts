// src/routes/attendance.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { markAttendanceSchema } from "../schemas/attendance.schema";const router = Router();

// POST /api/attendance
router.post("/", checkRole(["DEPUTY", "ADMIN", "TEACHER"]), validate(markAttendanceSchema), async (req, res) => {  const { date, childId, clubId, isPresent } = req.body as {
    date: string;
    childId: number;
    clubId?: number | null;
    isPresent: boolean;
  };
  // Если TEACHER — разрешаем отмечать только в своём кружке
  if (req.user!.role === "TEACHER" && clubId) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club || club.teacherId !== req.user!.employeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }
  const record = await prisma.attendance.upsert({
    where: { date_childId_clubId: { date: new Date(date), childId, clubId: clubId ?? null } },
    update: { isPresent },
    create: { date: new Date(date), childId, clubId: clubId ?? null, isPresent },
  });
  return res.status(201).json(record);
});

export default router;
