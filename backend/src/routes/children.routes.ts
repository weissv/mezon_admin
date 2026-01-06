// src/routes/children.routes.ts
import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { buildPagination, buildOrderBy, buildWhere } from "../utils/query";
import { logAction } from "../middleware/actionLogger";
import { validate } from "../middleware/validate";
import { createChildSchema, updateChildSchema } from "../schemas/child.schema";
const router = Router();

// Функция для синхронизации ребёнка с LMS
async function syncChildWithLms(childId: number, groupId: number) {
  // Проверяем, существует ли уже запись LmsSchoolStudent для этого ребёнка
  const existingLmsStudent = await prisma.lmsSchoolStudent.findFirst({
    where: { studentId: childId }
  });

  if (existingLmsStudent) {
    // Обновляем класс если он изменился
    if (existingLmsStudent.classId !== groupId) {
      await prisma.lmsSchoolStudent.update({
        where: { id: existingLmsStudent.id },
        data: { classId: groupId }
      });
    }
  } else {
    // Создаём новую запись LmsSchoolStudent
    await prisma.lmsSchoolStudent.create({
      data: {
        studentId: childId,
        classId: groupId,
        status: "active"
      }
    });
  }
}

// GET /api/children
router.get(
  "/",
  checkRole(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]),
  async (req, res) => {
    const { skip, take } = buildPagination(req.query);
    const orderBy = buildOrderBy(req.query, [
      "id",
      "firstName",
      "lastName",
      "birthDate",
      "status",
      "groupId",
      "createdAt",
    ]);
    const where = buildWhere<any>(req.query, ["status", "groupId", "lastName"]);
    const [items, total] = await Promise.all([
      prisma.child.findMany({ where, skip, take, orderBy, include: { group: true } }),
      prisma.child.count({ where }),
    ]);
    return res.json({ items, total });
  }
);


router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(createChildSchema), logAction("CREATE_CHILD", (req) => ({ body: req.body })), async (req, res) => {
  const child = await prisma.child.create({ data: req.body });
  
  // Синхронизируем с LMS
  await syncChildWithLms(child.id, child.groupId);
  
  return res.status(201).json(child);
});

router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), validate(updateChildSchema), logAction("UPDATE_CHILD", (req) => ({ id: req.params.id, body: req.body })), async (req, res) => {
  const id = Number(req.params.id);
  const child = await prisma.child.update({ where: { id }, data: req.body });
  
  // Синхронизируем с LMS (если изменился класс)
  if (req.body.groupId) {
    await syncChildWithLms(child.id, child.groupId);
  }
  
  return res.json(child);
});

router.delete(
  "/:id",
  checkRole(["ADMIN"]),
  logAction("DELETE_CHILD", (req) => ({ id: req.params.id })),
  async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid child id" });
    }

    try {
      // Сначала удаляем связанную запись LmsSchoolStudent
      await prisma.lmsSchoolStudent.deleteMany({ where: { studentId: id } });
      
      await prisma.child.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        // Deleting an already-removed child should be idempotent for the client
        return res.status(204).send();
      }
      throw error;
    }

    return res.status(204).send();
  }
);

// --- TemporaryAbsence CRUD ---

// GET /api/children/:id/absences - список временных отсутствий ребенка
router.get("/:id/absences", checkRole(["DEPUTY", "ADMIN", "TEACHER"]), async (req, res) => {
  const { id } = req.params;
  
  const absences = await prisma.temporaryAbsence.findMany({
    where: { childId: Number(id) },
    orderBy: { startDate: "desc" },
  });
  
  return res.json(absences);
});

// POST /api/children/:id/absences - добавить отсутствие
router.post("/:id/absences", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, reason } = req.body;
  
  const absence = await prisma.temporaryAbsence.create({
    data: {
      childId: Number(id),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    },
  });
  
  return res.status(201).json(absence);
});

// PUT /api/children/absences/:absenceId - обновить отсутствие
router.put("/absences/:absenceId", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { absenceId } = req.params;
  const { startDate, endDate, reason } = req.body;
  
  const absence = await prisma.temporaryAbsence.update({
    where: { id: Number(absenceId) },
    data: {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      reason,
    },
  });
  
  return res.json(absence);
});

// DELETE /api/children/absences/:absenceId
router.delete("/absences/:absenceId", checkRole(["ADMIN"]), async (req, res) => {
  const { absenceId } = req.params;
  await prisma.temporaryAbsence.delete({ where: { id: Number(absenceId) } });
  return res.status(204).send();
});

export default router;
