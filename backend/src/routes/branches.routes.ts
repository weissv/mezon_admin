// src/routes/branches.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { createBranchSchema } from "../schemas/branch.schema";
const router = Router();

router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (_req, res) => {
  const branches = await prisma.branch.findMany({ orderBy: { name: "asc" } });
  res.json(branches);
});

router.post("/", checkRole(["ADMIN"]), validate(createBranchSchema), async (req, res) => {
  const created = await prisma.branch.create({ data: req.body });
  res.status(201).json(created);
});

export default router;
