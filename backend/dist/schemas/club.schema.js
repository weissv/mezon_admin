"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollClubSchema = exports.createClubSchema = void 0;
// src/schemas/club.schema.ts
const zod_1 = require("zod");
exports.createClubSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        description: zod_1.z.string().optional(),
        teacherId: zod_1.z.number().int().positive(),
        schedule: zod_1.z.array(zod_1.z.object({ day: zod_1.z.string(), time: zod_1.z.string() })).optional(),
        cost: zod_1.z.coerce.number().nonnegative(),
        maxStudents: zod_1.z.number().int().positive(),
    }),
});
exports.enrollClubSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({ childId: zod_1.z.number().int().positive() }),
});
