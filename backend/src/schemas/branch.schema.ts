// src/schemas/branch.schema.ts
import { z } from "zod";

export const createBranchSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    address: z.string().min(3),
  }),
});
