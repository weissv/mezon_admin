import { Router } from "express";
import { checkRole } from "../middleware/checkRole";
import { OneCSyncService } from "../services/OneCSyncService";

const router = Router();

// POST /api/integrations/1c/sync
router.post(
  "/1c/sync",
  checkRole(["ADMIN", "ACCOUNTANT", "DIRECTOR"]),
  async (_req, res) => {
    try {
      const result = await OneCSyncService.mockSync();
      return res.json(result);
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
