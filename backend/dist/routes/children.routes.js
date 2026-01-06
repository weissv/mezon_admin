"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/children.routes.ts
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const query_1 = require("../utils/query");
const actionLogger_1 = require("../middleware/actionLogger");
const validate_1 = require("../middleware/validate");
const child_schema_1 = require("../schemas/child.schema");
const router = (0, express_1.Router)();
// Функция для синхронизации ребёнка с LMS
async function syncChildWithLms(childId, groupId) {
    // Проверяем, существует ли уже запись LmsSchoolStudent для этого ребёнка
    const existingLmsStudent = await prisma_1.prisma.lmsSchoolStudent.findFirst({
        where: { studentId: childId }
    });
    if (existingLmsStudent) {
        // Обновляем класс если он изменился
        if (existingLmsStudent.classId !== groupId) {
            await prisma_1.prisma.lmsSchoolStudent.update({
                where: { id: existingLmsStudent.id },
                data: { classId: groupId }
            });
        }
    }
    else {
        // Создаём новую запись LmsSchoolStudent
        await prisma_1.prisma.lmsSchoolStudent.create({
            data: {
                studentId: childId,
                classId: groupId,
                status: "active"
            }
        });
    }
}
// GET /api/children
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
    const { skip, take } = (0, query_1.buildPagination)(req.query);
    const orderBy = (0, query_1.buildOrderBy)(req.query, [
        "id",
        "firstName",
        "lastName",
        "birthDate",
        "status",
        "groupId",
        "createdAt",
    ]);
    const where = (0, query_1.buildWhere)(req.query, ["status", "groupId", "lastName"]);
    const [items, total] = await Promise.all([
        prisma_1.prisma.child.findMany({ where, skip, take, orderBy, include: { group: true } }),
        prisma_1.prisma.child.count({ where }),
    ]);
    return res.json({ items, total });
});
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.createChildSchema), (0, actionLogger_1.logAction)("CREATE_CHILD", (req) => ({ body: req.body })), async (req, res) => {
    const child = await prisma_1.prisma.child.create({ data: req.body });
    // Синхронизируем с LMS
    await syncChildWithLms(child.id, child.groupId);
    return res.status(201).json(child);
});
router.put("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.updateChildSchema), (0, actionLogger_1.logAction)("UPDATE_CHILD", (req) => ({ id: req.params.id, body: req.body })), async (req, res) => {
    const id = Number(req.params.id);
    const child = await prisma_1.prisma.child.update({ where: { id }, data: req.body });
    // Синхронизируем с LMS (если изменился класс)
    if (req.body.groupId) {
        await syncChildWithLms(child.id, child.groupId);
    }
    return res.json(child);
});
router.delete("/:id", (0, checkRole_1.checkRole)(["ADMIN"]), (0, actionLogger_1.logAction)("DELETE_CHILD", (req) => ({ id: req.params.id })), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid child id" });
    }
    try {
        // Сначала удаляем связанную запись LmsSchoolStudent
        await prisma_1.prisma.lmsSchoolStudent.deleteMany({ where: { studentId: id } });
        await prisma_1.prisma.child.delete({ where: { id } });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            // Deleting an already-removed child should be idempotent for the client
            return res.status(204).send();
        }
        throw error;
    }
    return res.status(204).send();
});
// --- TemporaryAbsence CRUD ---
// GET /api/children/:id/absences - список временных отсутствий ребенка
router.get("/:id/absences", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER"]), async (req, res) => {
    const { id } = req.params;
    const absences = await prisma_1.prisma.temporaryAbsence.findMany({
        where: { childId: Number(id) },
        orderBy: { startDate: "desc" },
    });
    return res.json(absences);
});
// POST /api/children/:id/absences - добавить отсутствие
router.post("/:id/absences", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;
    const absence = await prisma_1.prisma.temporaryAbsence.create({
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
router.put("/absences/:absenceId", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    const { absenceId } = req.params;
    const { startDate, endDate, reason } = req.body;
    const absence = await prisma_1.prisma.temporaryAbsence.update({
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
router.delete("/absences/:absenceId", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const { absenceId } = req.params;
    await prisma_1.prisma.temporaryAbsence.delete({ where: { id: Number(absenceId) } });
    return res.status(204).send();
});
exports.default = router;
