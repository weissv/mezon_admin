import { Router } from "express";
import { checkRole } from "../middleware/checkRole";
import { logAction } from "../middleware/actionLogger";
import { validate } from "../middleware/validate";
import {
  createInvoiceSchema,
  generateInvoicesSchema,
  updateInvoiceStatusSchema,
  listInvoicesQuerySchema,
} from "../schemas/invoice.schema";
import { InvoiceService } from "../services/InvoiceService";
import { InvoiceStatus } from "@prisma/client";

const router = Router();

const financeAllowedRoles = ["DEPUTY", "ADMIN", "ACCOUNTANT", "DIRECTOR"];
const editRoles = ["DEPUTY", "ADMIN", "ACCOUNTANT"];

// GET /api/finance/invoices — список всех счетов с фильтрами и пагинацией
router.get(
  "/",
  checkRole(financeAllowedRoles),
  validate(listInvoicesQuerySchema),
  async (req, res) => {
    const { page, pageSize, status, groupId, childId, period, search } = req.query as Record<string, string | undefined>;

    const result = await InvoiceService.listInvoices({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      status: status as InvoiceStatus | undefined,
      groupId: groupId ? Number(groupId) : undefined,
      childId: childId ? Number(childId) : undefined,
      period,
      search,
    });

    return res.json(result);
  }
);

// POST /api/finance/invoices/generate — массовая автогенерация счетов
router.post(
  "/generate",
  checkRole(editRoles),
  validate(generateInvoicesSchema),
  logAction("GENERATE_MONTHLY_INVOICES", (req) => ({ body: req.body })),
  async (req, res) => {
    const result = await InvoiceService.generateMonthlyInvoices(req.body);
    return res.status(201).json(result);
  }
);

// POST /api/finance/invoices — ручное выставление счета
router.post(
  "/",
  checkRole(editRoles),
  validate(createInvoiceSchema),
  logAction("CREATE_SINGLE_INVOICE", (req) => ({ body: req.body })),
  async (req, res) => {
    const invoice = await InvoiceService.createSingleInvoice(req.body);
    return res.status(201).json(invoice);
  }
);

// PUT /api/finance/invoices/:id/status — сбыт / смена статуса счета
router.put(
  "/:id/status",
  checkRole(editRoles),
  validate(updateInvoiceStatusSchema),
  logAction("UPDATE_INVOICE_STATUS", (req) => ({ id: req.params.id, status: req.body.status })),
  async (req, res) => {
    const invoice = await InvoiceService.updateStatus(Number(req.params.id), req.body.status);
    return res.json(invoice);
  }
);

export default router;
