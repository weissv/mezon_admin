// src/schemas/security.schema.ts
import { z } from "zod";

export const createSecurityLogSchema = z.object({
  body: z.object({
    eventType: z.string().min(2),
    description: z.string().optional(),
    date: z.string().datetime(),
    documentUrl: z.string().url().optional().nullable(),
  }),
});
