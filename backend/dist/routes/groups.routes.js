"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/groups.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const router = (0, express_1.Router)();
// GET /api/groups
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
    const groups = await prisma_1.prisma.group.findMany({
        include: {
            _count: {
                select: { children: true }
            },
            teacher: {
                select: { id: true, firstName: true, lastName: true }
            }
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }]
    });
    // Сортировка по номеру класса (1 класс, 2 класс, ... 11 класс)
    groups.sort((a, b) => {
        // Сначала сортируем по grade, если есть
        if (a.grade !== null && b.grade !== null) {
            return a.grade - b.grade;
        }
        // Если grade нет, парсим из названия
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });
    return res.json(groups);
});
// POST /api/groups - создать класс
router.post("/", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const { name, grade, academicYear, teacherId, capacity, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: "Название обязательно" });
    }
    const group = await prisma_1.prisma.group.create({
        data: {
            name,
            grade: grade ?? null,
            academicYear: academicYear ?? null,
            teacherId: teacherId ?? null,
            capacity: capacity ?? 30,
            description: description ?? null
        },
        include: {
            teacher: {
                select: { id: true, firstName: true, lastName: true }
            }
        }
    });
    return res.status(201).json(group);
});
// PUT /api/groups/:id - обновить класс
router.put("/:id", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const { id } = req.params;
    const { name, grade, academicYear, teacherId, capacity, description } = req.body;
    const group = await prisma_1.prisma.group.update({
        where: { id: Number(id) },
        data: {
            ...(name !== undefined && { name }),
            ...(grade !== undefined && { grade }),
            ...(academicYear !== undefined && { academicYear }),
            ...(teacherId !== undefined && { teacherId }),
            ...(capacity !== undefined && { capacity }),
            ...(description !== undefined && { description })
        },
        include: {
            teacher: {
                select: { id: true, firstName: true, lastName: true }
            }
        }
    });
    return res.json(group);
});
// DELETE /api/groups/:id - удалить класс
router.delete("/:id", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    const { id } = req.params;
    // Проверяем, есть ли дети в этом классе
    const childrenCount = await prisma_1.prisma.child.count({
        where: { groupId: Number(id) }
    });
    if (childrenCount > 0) {
        return res.status(400).json({
            error: `В этом классе ${childrenCount} детей. Сначала переведите их в другой класс.`
        });
    }
    await prisma_1.prisma.group.delete({
        where: { id: Number(id) }
    });
    return res.status(204).send();
});
exports.default = router;
