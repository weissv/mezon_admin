import { Router } from "express";
import { checkRole } from "../middleware/checkRole";
import { logAction } from "../middleware/actionLogger";
import { validate } from "../middleware/validate";
import { createContractSchema, updateContractSchema } from "../schemas/contract.schema";
import { ContractService } from "../services/ContractService";

const router = Router();

const allowedRoles = ["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"];
const editRoles = ["DEPUTY", "ADMIN", "ACCOUNTANT"];

// GET /api/children/:childId/contracts — список договоров ребенка
router.get(
  "/children/:childId/contracts",
  checkRole(allowedRoles),
  async (req, res) => {
    const contracts = await ContractService.findByChildId(Number(req.params.childId));
    return res.json(contracts);
  }
);

// POST /api/children/:childId/contracts — создание нового договора ребенка
router.post(
  "/children/:childId/contracts",
  checkRole(editRoles),
  validate(createContractSchema),
  logAction("CREATE_STUDENT_CONTRACT", (req) => ({ childId: req.params.childId, body: req.body })),
  async (req, res) => {
    const contract = await ContractService.create(Number(req.params.childId), req.body);
    return res.status(201).json(contract);
  }
);

// PUT /api/contracts/:id — обновление договора
router.put(
  "/contracts/:id",
  checkRole(editRoles),
  validate(updateContractSchema),
  logAction("UPDATE_STUDENT_CONTRACT", (req) => ({ id: req.params.id, body: req.body })),
  async (req, res) => {
    const contract = await ContractService.update(Number(req.params.id), req.body);
    return res.json(contract);
  }
);

// DELETE /api/contracts/:id — удаление договора
router.delete(
  "/contracts/:id",
  checkRole(["ADMIN", "ACCOUNTANT"]),
  logAction("DELETE_STUDENT_CONTRACT", (req) => ({ id: req.params.id })),
  async (req, res) => {
    await ContractService.delete(Number(req.params.id));
    return res.status(204).send();
  }
);

export default router;
