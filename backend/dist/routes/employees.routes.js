"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/employees.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const query_1 = require("../utils/query");
const validate_1 = require("../middleware/validate");
const employee_schema_1 = require("../schemas/employee.schema");
const router = (0, express_1.Router)();
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    const { skip, take } = (0, query_1.buildPagination)(req.query);
    const orderBy = (0, query_1.buildOrderBy)(req.query, [
        "id",
        "firstName",
        "lastName",
        "position",
        "hireDate",
        "rate",
        "branchId",
        "createdAt",
    ]);
    const where = (0, query_1.buildWhere)(req.query, ["branchId", "position", "lastName"]);
    const [items, total] = await Promise.all([
        prisma_1.prisma.employee.findMany({ where, skip, take, orderBy, include: { branch: true, user: true } }),
        prisma_1.prisma.employee.count({ where }),
    ]);
    return res.json({ items, total });
});
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(employee_schema_1.createEmployeeSchema), async (req, res) => {
    const { body } = req;
    const { user, ...employee } = body;
    const created = await prisma_1.prisma.$transaction(async (tx) => {
        const emp = await tx.employee.create({ data: employee });
        let usr = null;
        if (user) {
            usr = await tx.user.create({
                data: {
                    email: user.email,
                    passwordHash: await (await Promise.resolve().then(() => __importStar(require("bcryptjs")))).hash(user.password, 10),
                    role: user.role,
                    employeeId: emp.id,
                },
            });
        }
        return { emp, usr };
    });
    return res.status(201).json(created);
});
// TODO: При увольнении (fireDate): деактивировать User, открепить от Club, записать в ActionLog.
router.put("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(employee_schema_1.updateEmployeeSchema), async (req, res) => {
    const id = Number(req.params.id);
    const updated = await prisma_1.prisma.employee.update({ where: { id }, data: req.body });
    return res.json(updated);
});
// GET /api/employees/reminders - напоминания о медосмотрах и аттестации
router.get("/reminders", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    const { days = 30 } = req.query;
    const futureDate = new Date(Date.now() + Number(days) * 24 * 3600 * 1000);
    const [medicalCheckups, attestations] = await Promise.all([
        // Сотрудники, которым скоро нужен медосмотр
        prisma_1.prisma.employee.findMany({
            where: {
                fireDate: null,
                medicalCheckupDate: {
                    lte: futureDate,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                medicalCheckupDate: true,
            },
            orderBy: { medicalCheckupDate: "asc" },
        }),
        // Сотрудники, которым скоро нужна аттестация
        prisma_1.prisma.employee.findMany({
            where: {
                fireDate: null,
                attestationDate: {
                    lte: futureDate,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                attestationDate: true,
            },
            orderBy: { attestationDate: "asc" },
        }),
    ]);
    return res.json({
        medicalCheckups: medicalCheckups.map((e) => ({
            ...e,
            daysUntil: Math.ceil((new Date(e.medicalCheckupDate).getTime() - Date.now()) / (24 * 3600 * 1000)),
        })),
        attestations: attestations.map((e) => ({
            ...e,
            daysUntil: Math.ceil((new Date(e.attestationDate).getTime() - Date.now()) / (24 * 3600 * 1000)),
        })),
    });
});
exports.default = router;
