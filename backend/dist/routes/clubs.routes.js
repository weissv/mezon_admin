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
router.get("/", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
    const isTeacher = req.user.role === "TEACHER";
    const where = isTeacher ? { teacherId: req.user.employeeId } : {};
    const clubs = await prisma_1.prisma.club.findMany({ where, include: { teacher: true } });
    return res.json(clubs);
});
// GET /api/clubs/:id
router.get("/:id", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT", "TEACHER"]), async (req, res) => {
    const id = Number(req.params.id);
    const club = await prisma_1.prisma.club.findUnique({ where: { id } });
    if (!club)
        return res.status(404).json({ message: "Not found" });
    if (req.user.role === "TEACHER" && club.teacherId !== req.user.employeeId) {
        return res.status(403).json({ message: "Forbidden" });
    }
    return res.json(club);
});
router.post("/", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(club_schema_1.createClubSchema), async (req, res) => {
    const club = await prisma_1.prisma.club.create({ data: req.body });
    res.status(201).json(club);
});
// DELETE /api/clubs/:id - удаление кружка
router.delete("/:id", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }
    try {
        // Удаляем связанные записи
        await prisma_1.prisma.clubEnrollment.deleteMany({ where: { clubId: id } });
        await prisma_1.prisma.clubRating.deleteMany({ where: { clubId: id } });
        await prisma_1.prisma.attendance.deleteMany({ where: { clubId: id } });
        await prisma_1.prisma.club.delete({ where: { id } });
    }
    catch (error) {
        if (error?.code === "P2025") {
            return res.status(204).send();
        }
        throw error;
    }
    return res.status(204).send();
});
router.post("/:id/enroll", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), (0, validate_1.validate)(club_schema_1.enrollClubSchema), async (req, res) => {
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
// --- ClubRating CRUD ---
// GET /api/clubs/:id/ratings - получить оценки кружка
router.get("/:id/ratings", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER"]), async (req, res) => {
    const { id } = req.params;
    const ratings = await prisma_1.prisma.clubRating.findMany({
        where: { clubId: Number(id) },
        include: {
            child: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { rating: "desc" },
    });
    // Средняя оценка
    const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
    return res.json({
        ratings,
        average: Math.round(avgRating * 10) / 10,
        count: ratings.length,
    });
});
// POST /api/clubs/:id/ratings - добавить оценку кружку
router.post("/:id/ratings", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN"]), async (req, res) => {
    const { id } = req.params;
    const { childId, rating, comment } = req.body;
    // Проверяем, что ребенок записан в кружок
    const enrollment = await prisma_1.prisma.clubEnrollment.findUnique({
        where: {
            childId_clubId: {
                childId: Number(childId),
                clubId: Number(id),
            },
        },
    });
    if (!enrollment) {
        return res.status(400).json({ error: "Child is not enrolled in this club" });
    }
    const clubRating = await prisma_1.prisma.clubRating.upsert({
        where: {
            clubId_childId: {
                clubId: Number(id),
                childId: Number(childId),
            },
        },
        update: { rating, comment: comment || null },
        create: {
            clubId: Number(id),
            childId: Number(childId),
            rating,
            comment: comment || null,
        },
    });
    return res.status(201).json(clubRating);
});
// DELETE /api/clubs/ratings/:ratingId - удалить оценку
router.delete("/ratings/:ratingId", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const { ratingId } = req.params;
    await prisma_1.prisma.clubRating.delete({ where: { id: Number(ratingId) } });
    return res.status(204).send();
});
// GET /api/clubs/:id/reports - отчет по кружку (посещаемость + финансы)
router.get("/:id/reports", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const club = await prisma_1.prisma.club.findUnique({
        where: { id: Number(id) },
        include: {
            teacher: { select: { firstName: true, lastName: true } },
        },
    });
    if (!club) {
        return res.status(404).json({ error: "Club not found" });
    }
    // Проверка прав для учителя
    if (req.user.role === "TEACHER" && club.teacherId !== req.user.employeeId) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const where = {};
    if (startDate || endDate) {
        where.date = {};
        if (startDate)
            where.date.gte = new Date(String(startDate));
        if (endDate)
            where.date.lte = new Date(String(endDate));
    }
    const [enrollments, attendance, finances] = await Promise.all([
        // Записи на кружок
        prisma_1.prisma.clubEnrollment.findMany({
            where: { clubId: Number(id) },
            include: {
                child: { select: { id: true, firstName: true, lastName: true } },
            },
        }),
        // Посещаемость (из общей таблицы Attendance)
        // TODO: может потребоваться отдельная модель ClubAttendance
        prisma_1.prisma.attendance.count({
            where: {
                ...where,
                child: {
                    enrollments: {
                        some: {
                            clubId: Number(id),
                            status: "ACTIVE",
                        },
                    },
                },
                isPresent: true,
            },
        }),
        // Финансовые транзакции по кружку
        prisma_1.prisma.financeTransaction.findMany({
            where: {
                ...where,
                clubId: Number(id),
            },
        }),
    ]);
    const totalIncome = finances
        .filter((f) => f.type === "INCOME")
        .reduce((sum, f) => sum + Number(f.amount), 0);
    const totalExpense = finances
        .filter((f) => f.type === "EXPENSE")
        .reduce((sum, f) => sum + Number(f.amount), 0);
    return res.json({
        club: {
            id: club.id,
            name: club.name,
            teacher: `${club.teacher.firstName} ${club.teacher.lastName}`,
            maxStudents: club.maxStudents,
        },
        enrollments: {
            active: enrollments.filter((e) => e.status === "ACTIVE").length,
            waiting: enrollments.filter((e) => e.status === "WAITING_LIST").length,
            total: enrollments.length,
        },
        attendance: {
            totalPresent: attendance,
        },
        finances: {
            income: totalIncome,
            expense: totalExpense,
            balance: totalIncome - totalExpense,
        },
    });
});
// Алиас для совместимости с фронтендом (единственное число)
router.get("/:id/report", (0, checkRole_1.checkRole)(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res, next) => {
    // Перенаправляем на основной эндпоинт
    req.url = req.url.replace('/report', '/reports');
    next();
}, async (req, res) => {
    // Основной обработчик уже вызовется через next()
});
exports.default = router;
