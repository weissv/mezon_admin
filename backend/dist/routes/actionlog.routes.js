"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/actionlog.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const checkRole_1 = require("../middleware/checkRole");
const router = (0, express_1.Router)();
router.get("/", (0, checkRole_1.checkRole)(["DEPUTY", "ADMIN"]), async (req, res) => {
    const logs = await prisma_1.prisma.actionLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 200,
        include: { user: true },
    });
    res.json(logs);
});
exports.default = router;
