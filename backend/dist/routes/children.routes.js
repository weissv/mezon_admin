"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/children.routes.ts
// Thin controller — вся бизнес-логика в ChildService
const express_1 = require("express");
const checkRole_1 = require("../middleware/checkRole");
const actionLogger_1 = require("../middleware/actionLogger");
const validate_1 = require("../middleware/validate");
const child_schema_1 = require("../schemas/child.schema");
const ChildService_1 = require("../services/ChildService");
const router = (0, express_1.Router)();
// ======== Child CRUD ========
// GET /api/children — список с фильтрами, поиском, пагинацией
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), (0, validate_1.validate)(child_schema_1.childListQuerySchema), async (req, res) => {
    const { page, pageSize, sortBy, sortOrder, status, groupId, search, gender } = req.query;
    const result = await ChildService_1.ChildService.findMany({
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortOrder: sortOrder,
        status,
        groupId: groupId ? Number(groupId) : undefined,
        search,
        gender,
    });
    return res.json(result);
});
// GET /api/children/:id — детальный профиль ребёнка
router.get("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
    const child = await ChildService_1.ChildService.findById(Number(req.params.id));
    return res.json(child);
});
// POST /api/children — создать ребёнка
router.post("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.createChildSchema), (0, actionLogger_1.logAction)("CREATE_CHILD", (req) => ({ body: req.body })), async (req, res) => {
    const child = await ChildService_1.ChildService.create(req.body);
    return res.status(201).json(child);
});
// PUT /api/children/:id — обновить ребёнка
router.put("/:id", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.updateChildSchema), (0, actionLogger_1.logAction)("UPDATE_CHILD", (req) => ({ id: req.params.id, body: req.body })), async (req, res) => {
    const child = await ChildService_1.ChildService.update(Number(req.params.id), req.body);
    return res.json(child);
});
// PUT /api/children/:id/archive — архивировать (soft-delete)
router.put("/:id/archive", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, actionLogger_1.logAction)("ARCHIVE_CHILD", (req) => ({ id: req.params.id })), async (req, res) => {
    await ChildService_1.ChildService.archive(Number(req.params.id));
    return res.status(204).send();
});
// DELETE /api/children/:id — полное удаление (только админ)
router.delete("/:id", (0, checkRole_1.checkRole)(["ADMIN"]), (0, actionLogger_1.logAction)("DELETE_CHILD", (req) => ({ id: req.params.id })), async (req, res) => {
    await ChildService_1.ChildService.delete(Number(req.params.id));
    return res.status(204).send();
});
// ======== TemporaryAbsence CRUD ========
// GET /api/children/:id/absences
router.get("/:id/absences", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN", "TEACHER"]), async (req, res) => {
    const absences = await ChildService_1.ChildService.getAbsences(Number(req.params.id));
    return res.json(absences);
});
// POST /api/children/:id/absences
router.post("/:id/absences", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.createAbsenceSchema), async (req, res) => {
    const absence = await ChildService_1.ChildService.addAbsence(Number(req.params.id), req.body);
    return res.status(201).json(absence);
});
// PUT /api/children/absences/:absenceId
router.put("/absences/:absenceId", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), (0, validate_1.validate)(child_schema_1.updateAbsenceSchema), async (req, res) => {
    const absence = await ChildService_1.ChildService.updateAbsence(Number(req.params.absenceId), req.body);
    return res.json(absence);
});
// DELETE /api/children/absences/:absenceId
router.delete("/absences/:absenceId", (0, checkRole_1.checkRole)(["ADMIN"]), async (req, res) => {
    await ChildService_1.ChildService.deleteAbsence(Number(req.params.absenceId));
    return res.status(204).send();
});
exports.default = router;
