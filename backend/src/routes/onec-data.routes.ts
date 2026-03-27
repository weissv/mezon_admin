import { Router, Request, Response } from "express";
import { checkRole } from "../middleware/checkRole";
import { prisma as db } from "../prisma";

const router = Router();
const allowedRoles = ["ADMIN", "ACCOUNTANT", "DIRECTOR"];

// ── Helpers ───────────────────────────────────────────────────

function paginationParams(req: Request) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

function dateFilter(req: Request) {
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const filter: any = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return Object.keys(filter).length ? filter : undefined;
}

// ── Summary: counts per model ─────────────────────────────────

router.get("/summary", checkRole(allowedRoles), async (_req: Request, res: Response) => {
  try {
    const [
      organizations, nomenclature, bankAccounts, contracts, employees,
      positions, fixedAssets, warehouses, currencies, departments,
      documents, hrDocuments, payrollDocuments,
    ] = await Promise.all([
      db.oneCOrganization.count(),
      db.oneCNomenclature.count(),
      db.oneCBankAccount.count(),
      db.oneCContract.count(),
      db.oneCEmployee.count(),
      db.oneCPosition.count(),
      db.oneCFixedAsset.count(),
      db.oneCWarehouse.count(),
      db.oneCCurrency.count(),
      db.oneCDepartment.count(),
      db.oneCDocument.count(),
      db.oneCHRDocument.count(),
      db.oneCPayrollDocument.count(),
    ]);

    // Document type breakdowns
    const [docTypes, hrDocTypes, payrollDocTypes] = await Promise.all([
      db.oneCDocument.groupBy({ by: ["docType"], _count: true }),
      db.oneCHRDocument.groupBy({ by: ["docType"], _count: true }),
      db.oneCPayrollDocument.groupBy({ by: ["docType"], _count: true }),
    ]);

    return res.json({
      catalogs: { organizations, nomenclature, bankAccounts, contracts, employees, positions, fixedAssets, warehouses, currencies, departments },
      documents: { total: documents, byType: docTypes.map((d: any) => ({ type: d.docType, count: d._count })) },
      hrDocuments: { total: hrDocuments, byType: hrDocTypes.map((d: any) => ({ type: d.docType, count: d._count })) },
      payrollDocuments: { total: payrollDocuments, byType: payrollDocTypes.map((d: any) => ({ type: d.docType, count: d._count })) },
    });
  } catch (err: any) {
    console.error("1C data summary error:", err.message);
    return res.status(500).json({ error: "Ошибка получения сводки данных 1С" });
  }
});

// ── Catalogs: GET /catalogs/:type ─────────────────────────────

const catalogModels: Record<string, any> = {
  organizations: "oneCOrganization",
  nomenclature: "oneCNomenclature",
  "bank-accounts": "oneCBankAccount",
  contracts: "oneCContract",
  employees: "oneCEmployee",
  positions: "oneCPosition",
  "fixed-assets": "oneCFixedAsset",
  warehouses: "oneCWarehouse",
  currencies: "oneCCurrency",
  departments: "oneCDepartment",
};

router.get("/catalogs/:type", checkRole(allowedRoles), async (req: Request, res: Response) => {
  const modelField = catalogModels[req.params.type];
  if (!modelField) return res.status(400).json({ error: "Unknown catalog type" });

  const { skip, take, page, limit } = paginationParams(req);
  const search = (req.query.search as string) || "";

  try {
    const model = (db as any)[modelField];
    const where = search ? { name: { contains: search, mode: "insensitive" } } : {};
    const [items, total] = await Promise.all([
      model.findMany({ where, orderBy: { name: "asc" }, skip, take }),
      model.count({ where }),
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error(`Catalog ${req.params.type} error:`, err.message);
    return res.status(500).json({ error: "Ошибка получения справочника" });
  }
});

// ── Documents: GET /documents ─────────────────────────────────

router.get("/documents", checkRole(allowedRoles), async (req: Request, res: Response) => {
  const { skip, take, page, limit } = paginationParams(req);
  const docType = req.query.docType as string | undefined;
  const search = (req.query.search as string) || "";
  const dateFlt = dateFilter(req);

  try {
    const where: any = {};
    if (docType) where.docType = docType;
    if (dateFlt) where.date = dateFlt;
    if (search) {
      where.OR = [
        { documentNumber: { contains: search, mode: "insensitive" } },
        { comment: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.oneCDocument.findMany({ where, orderBy: { date: "desc" }, skip, take }),
      db.oneCDocument.count({ where }),
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error("1C documents error:", err.message);
    return res.status(500).json({ error: "Ошибка получения документов" });
  }
});

// ── HR Documents: GET /hr-documents ───────────────────────────

router.get("/hr-documents", checkRole(allowedRoles), async (req: Request, res: Response) => {
  const { skip, take, page, limit } = paginationParams(req);
  const docType = req.query.docType as string | undefined;
  const search = (req.query.search as string) || "";
  const dateFlt = dateFilter(req);

  try {
    const where: any = {};
    if (docType) where.docType = docType;
    if (dateFlt) where.date = dateFlt;
    if (search) {
      where.OR = [
        { documentNumber: { contains: search, mode: "insensitive" } },
        { employeeName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.oneCHRDocument.findMany({ where, orderBy: { date: "desc" }, skip, take }),
      db.oneCHRDocument.count({ where }),
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error("1C HR documents error:", err.message);
    return res.status(500).json({ error: "Ошибка получения кадровых документов" });
  }
});

// ── Payroll Documents: GET /payroll-documents ─────────────────

router.get("/payroll-documents", checkRole(allowedRoles), async (req: Request, res: Response) => {
  const { skip, take, page, limit } = paginationParams(req);
  const docType = req.query.docType as string | undefined;
  const dateFlt = dateFilter(req);

  try {
    const where: any = {};
    if (docType) where.docType = docType;
    if (dateFlt) where.date = dateFlt;

    const [items, total] = await Promise.all([
      db.oneCPayrollDocument.findMany({ where, orderBy: { date: "desc" }, skip, take }),
      db.oneCPayrollDocument.count({ where }),
    ]);
    return res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    console.error("1C payroll documents error:", err.message);
    return res.status(500).json({ error: "Ошибка получения зарплатных документов" });
  }
});

export default router;
