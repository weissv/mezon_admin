import { Router } from "express";
import { checkRole } from "../middleware/checkRole";
import { oneCSyncService } from "../services/onec/1c-sync.service";

const router = Router();

// POST /api/integrations/1c/sync
router.post(
  "/1c/sync",
  checkRole(["ADMIN", "ACCOUNTANT", "DIRECTOR"]),
  async (_req, res) => {
    try {
      const report = await oneCSyncService.syncAll();
      return res.json(report);
    } catch (error: any) {
      console.error("1C sync error:", error);
      return res.status(500).json({
        status: "error",
        message: "Ошибка синхронизации с 1С",
      });
    }
  }
);

export default router;
