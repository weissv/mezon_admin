"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBranchSchema = void 0;
// src/schemas/branch.schema.ts
const zod_1 = require("zod");
exports.createBranchSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        address: zod_1.z.string().min(3),
    }),
});
