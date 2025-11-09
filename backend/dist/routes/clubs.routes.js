"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/clubs.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const validate_1 = require("../middleware/validate");
const club_schema_1 = require("../schemas/club.schema");
const router = (0, express_1.Router)();
// GET /api/clubs
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
    const isTeacher = req.user.role === "TEACHER";
    const where = isTeacher ? { teacherId: req.user.employeeId } : {};
    const clubs = await prisma_1.prisma.club.findMany({ where, include: { teacher: true } });
    return res.json(clubs);
});
// GET /api/clubs/:id
router.get("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
    const id = Number(req.params.id);
    const club = await prisma_1.prisma.club.findUnique({ where: { id } });
    if (!club)
        return res.status(404).json({ message: "Not found" });
    if (req.user.role === "TEACHER" && club.teacherId !== req.user.employeeId) {
        return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(club);
});
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(club_schema_1.createClubSchema), async (req, res) => {
    const club = await prisma_1.prisma.club.create({ data: req.body });
    res.status(201).json(club);
});
router.post("/:id/enroll", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(club_schema_1.enrollClubSchema), async (req, res) => {
    const clubId = Number(req.params.id);
    const { childId } = req.body;
    // Валидация вместимости
    const [club, activeCount] = await Promise.all([
        prisma_1.prisma.club.findUnique({ where: { id: clubId } }),
        prisma_1.prisma.clubEnrollment.count({ where: { clubId, status: "ACTIVE" } }),
    ]);
    if (!club)
        return res.status(404).json({ message: "Club not found" });
    if (activeCount >= club.maxStudents) {
        // Добавляем в лист ожидания, если заполнено
        const enrollment = await prisma_1.prisma.clubEnrollment.upsert({
            where: { childId_clubId: { childId, clubId } },
            update: { status: "WAITING_LIST" },
            create: { childId, clubId, status: "WAITING_LIST" },
        });
        return res.status(201).json({ enrollment, message: "Added to waiting list" });
    }
    const enrollment = await prisma_1.prisma.clubEnrollment.upsert({
        where: { childId_clubId: { childId, clubId } },
        update: { status: "ACTIVE" },
        create: { childId, clubId, status: "ACTIVE" },
    });
    return res.status(201).json({ enrollment, message: "Enrolled" });
});
exports.default = router;
