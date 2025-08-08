// src/routes/actionlog.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
const router = Router();

router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const logs = await prisma.actionLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 200,
    include: { user: true },
  });
  res.json(logs);
});

export default router;
