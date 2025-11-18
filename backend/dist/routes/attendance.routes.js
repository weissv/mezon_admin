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
    if (req.user.role === "TEACHER") {
        if (!clubId) {
            return res.status(403).json({ message: "Teachers can only mark attendance for their clubs" });
        }
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
    const attendanceWhere = {
        date: attendanceDate,
        childId,
        clubId: clubId ?? null,
    };
    const existing = await prisma_1.prisma.attendance.findFirst({ where: attendanceWhere });
    const record = existing
        ? await prisma_1.prisma.attendance.update({
            where: { id: existing.id },
            data: { isPresent },
        })
        : await prisma_1.prisma.attendance.create({
            data: {
                date: attendanceDate,
                childId,
                clubId: clubId ?? null,
                isPresent,
            },
        });
    return res.status(existing ? 200 : 201).json(record);
});
exports.default = router;
