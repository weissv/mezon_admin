// src/schemas/maintenance.schema.ts
import { z } from "zod";

export const createMaintenanceSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    status: z.enum(["NEW", "IN_PROGRESS", "DONE"]).optional(),
    type: z.enum(["REPAIR", "PURCHASE"]),
  }),
});

export const updateMaintenanceSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    status: z.enum(["NEW", "IN_PROGRESS", "DONE"]).optional(),
    type: z.enum(["REPAIR", "PURCHASE"]).optional(),
  }),
});
