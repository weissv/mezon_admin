// src/routes/groups.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// GET /api/groups
router.get("/", checkRole(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
  const groups = await prisma.group.findMany();
  return res.json(groups);
});

export default router;
