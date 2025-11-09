"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAttendanceSchema = void 0;
// src/schemas/attendance.schema.ts
const zod_1 = require("zod");
exports.markAttendanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().datetime(),
        childId: zod_1.z.number().int().positive(),
        clubId: zod_1.z.number().int().positive().optional().nullable(),
        isPresent: zod_1.z.boolean(),
    }),
});
