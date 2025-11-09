"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/attendance.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const attendance_schema_1 = require("../schemas/attendance.schema");
const router = (0, express_1.Router)();
// POST /api/attendance
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER"]), (0, validate_1.validate)(attendance_schema_1.markAttendanceSchema), async (req, res) => {
    const { date, childId, clubId, isPresent } = req.body;
    // Если TEACHER — разрешаем отмечать только в своём кружке
    if (req.user.role === "TEACHER" && clubId) {
        const employeeId = req.user.employeeId;
        if (!employeeId) {
            return res.status(403).json({ message: "Forbidden: User is not a valid employee." });
        }
        const club = await prisma_1.prisma.club.findUnique({ where: { id: clubId } });
        if (!club || club.teacherId !== employeeId) {
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
    record = await prisma_1.prisma.attendance.findUnique({
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
        record = await prisma_1.prisma.attendance.update({
            where: { id: record.id },
            data: { isPresent },
        });
    }
    else {
        // Создаем новую
        record = await prisma_1.prisma.attendance.create({
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
exports.default = router;
