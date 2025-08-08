// src/routes/security.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { createSecurityLogSchema } from "../schemas/security.schema";

const router = Router();

router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (_req, res) => {
  const items = await prisma.securityLog.findMany({ orderBy: { date: "desc" } });
  res.json(items);
});

router.post("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const created = await prisma.securityLog.create({ data: req.body });
  res.status(201).json(created);
});
router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(createSecurityLogSchema), async (req, res) => { /* ... */ });

export default router;
