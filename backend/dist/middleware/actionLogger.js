"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const prisma_1 = require("../prisma");
// Универсальный логгер действий
const logAction = (action, details) => async (req, _res, next) => {
    try {
        if (req.user) {
            await prisma_1.prisma.actionLog.create({
                data: {
                    userId: req.user.id,
                    action,
                    details: details ? details(req) : undefined,
                },
            });
        }
    }
    catch (e) {
        // Не валим основной флоу, если логирование упало
        console.warn("ActionLog error:", e);
    }
    next();
};
exports.logAction = logAction;
