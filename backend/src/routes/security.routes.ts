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

router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(createSecurityLogSchema), async (req, res) => {
  const created = await prisma.securityLog.create({ data: req.body });
  res.status(201).json(created);
});

// DELETE /api/security/:id
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    await prisma.securityLog.delete({ where: { id } });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(204).send();
    }
    throw error;
  }
  return res.status(204).send();
});

export default router;
