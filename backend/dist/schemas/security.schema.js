"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSecurityLogSchema = void 0;
// src/schemas/security.schema.ts
const zod_1 = require("zod");
exports.createSecurityLogSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventType: zod_1.z.enum(["INCIDENT", "FIRE_CHECK", "VISITOR_LOG", "DOCUMENT"]),
        description: zod_1.z.string().optional(),
        date: zod_1.z.string().datetime(),
        documentUrl: zod_1.z.string().url().optional().nullable(),
    }),
});
