"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMaintenanceSchema = exports.createMaintenanceSchema = void 0;
// src/schemas/maintenance.schema.ts
const zod_1 = require("zod");
exports.createMaintenanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3),
        description: zod_1.z.string().optional(),
        status: zod_1.z.enum(["NEW", "IN_PROGRESS", "DONE"]).optional(),
        type: zod_1.z.enum(["REPAIR", "PURCHASE"]),
    }),
});
exports.updateMaintenanceSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).optional(),
        description: zod_1.z.string().optional(),
        status: zod_1.z.enum(["NEW", "IN_PROGRESS", "DONE"]).optional(),
        type: zod_1.z.enum(["REPAIR", "PURCHASE"]).optional(),
    }),
});
