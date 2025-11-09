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
    const employeeId = req.user!.employeeId;
    if (!employeeId) {
      return res.status(403).json({ message: "Forbidden: User is not a valid employee." });
    }
    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club || club.teacherId !== (employeeId as number)) {
      return res.status(403).json({ message: "Forbidden" });
    }
  }
const attendanceDate = new Date(date);
  let record;

  if (!clubId) {
    // clubId не предоставлен.
    // Ваша старая логика `else` искала `clubId: null`, но вы не можете
    // создать запись с `clubId: null` и `isPresent`, если вы не знаете, какой кружок
    // имелся в виду. Поэтому здесь лучше вернуть ошибку.
    return res.status(400).json({ message: "clubId is required" });
  }

  // Если мы здесь, clubId - это 100% number.
  // Ищем существующую запись
  record = await prisma.attendance.findUnique({
    where: { 
      date_childId_clubId: { 
        date: attendanceDate, 
        childId, 
        clubId // <--- ПРОСТО ИСПОЛЬЗУЙТЕ ПЕРЕМЕННУЮ
      } 
    },
  });

  if (record) {
    // Обновляем существующую
    record = await prisma.attendance.update({
      where: { id: record.id },
      data: { isPresent },
    });
  } else {
    // Создаем новую
    record = await prisma.attendance.create({
      data: { 
        date: attendanceDate, 
        childId, 
        clubId, // <--- Здесь тоже самое
        isPresent 
      },
    });
  }

  return res.status(201).json(record);
});

export default router;