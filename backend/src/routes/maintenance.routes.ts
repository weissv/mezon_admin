// src/routes/maintenance.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
const router = Router();
import { validate } from "../middleware/validate";
import { createMaintenanceSchema, updateMaintenanceSchema } from "../schemas/maintenance.schema";

router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (_req, res) => {
  const items = await prisma.maintenanceRequest.findMany({
    include: { requester: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(items);
});

router.post("/", checkRole(["DEPUTY", "ADMIN", "TEACHER"]), validate(createMaintenanceSchema), async (req, res) => {
  const data = req.body;
  const created = await prisma.maintenanceRequest.create({
    data: { ...data, requesterId: req.user!.employeeId },
  });
  res.status(201).json(created);
});

router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), validate(updateMaintenanceSchema), async (req, res) => {
  const id = Number(req.params.id);
  const updated = await prisma.maintenanceRequest.update({ where: { id }, data: req.body });
  res.json(updated);
});
export default router;
