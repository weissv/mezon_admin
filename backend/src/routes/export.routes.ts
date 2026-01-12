import { Router } from "express";
import * as XLSX from "xlsx";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import { Prisma, ChildStatus, InventoryType, FinanceType, FinanceCategory, FinanceSource } from "@prisma/client";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import {
  exportExcelSchema,
  importExcelSchema,
  importGoogleSheetSchema,
  IntegrationEntity,
} from "../schemas/export.schema";
import { csvTextToRecords } from "../utils/csv";

const router = Router();

type ImportRow = Record<string, any>;

type ImportStats = {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
};

const defaultStats = (): ImportStats => ({ processed: 0, created: 0, updated: 0, skipped: 0 });

const entityExporters: Record<IntegrationEntity, () => Promise<Record<string, unknown>[]>> = {
  children: async () => {
    const children = await prisma.child.findMany({
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return children.map((child) => ({
      ID: child.id,
      "First Name": child.firstName,
      "Last Name": child.lastName,
      "Birth Date": child.birthDate.toISOString().split("T")[0],
      "Group ID": child.groupId,
      "Group Name": child.group?.name ?? "",
      Status: child.status,
    }));
  },
  employees: async () => {
    const employees = await prisma.employee.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return employees.map((employee) => ({
      ID: employee.id,
      "First Name": employee.firstName,
      "Last Name": employee.lastName,
      Position: employee.position,
      Rate: employee.rate,
      "Hire Date": employee.hireDate.toISOString().split("T")[0],
      "Contract End Date": employee.contractEndDate?.toISOString().split("T")[0] ?? "",
      "Medical Checkup Date": employee.medicalCheckupDate?.toISOString().split("T")[0] ?? "",
    }));
  },
  inventory: async () => {
    const items = await prisma.inventoryItem.findMany({
      include: { ingredient: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    });

    return items.map((item) => ({
      ID: item.id,
      Name: item.name,
      Quantity: item.quantity,
      Unit: item.unit,
      Type: item.type,
      "Expiry Date": item.expiryDate?.toISOString().split("T")[0] ?? "",
      "Ingredient ID": item.ingredientId ?? "",
      "Ingredient Name": item.ingredient?.name ?? "",
    }));
  },
  finance: async () => {
    const transactions = await prisma.financeTransaction.findMany({
      include: { club: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    });

    return transactions.map((tx) => ({
      ID: tx.id,
      Amount: tx.amount.toString(),
      Type: tx.type,
      Category: tx.category,
      Source: tx.source,
      Description: tx.description ?? "",
      Date: tx.date.toISOString().split("T")[0],
      "Club ID": tx.clubId ?? "",
      "Club Name": tx.club?.name ?? "",
    }));
  },
};

const entityImporters: Record<IntegrationEntity, (rows: ImportRow[]) => Promise<ImportStats>> = {
  children: async (rows) => {
    const stats = defaultStats();
    for (const row of rows) {
      stats.processed += 1;
      const firstName = getString(row, "First Name", "firstName", "Имя");
      const lastName = getString(row, "Last Name", "lastName", "Фамилия");
      const birthDate = getDate(row, "Birth Date", "birthDate");
      const groupId = getInt(row, "Group ID", "groupId");
      if (!firstName || !lastName || !birthDate || !groupId) {
        stats.skipped += 1;
        continue;
      }
      const status = (getEnum(row, Object.values(ChildStatus), "Status", "status") ?? ChildStatus.ACTIVE) as ChildStatus;
      const payload = {
        firstName,
        lastName,
        birthDate,
        groupId,
        status,
      };
      const id = getInt(row, "ID", "id");
      try {
        await upsertByNumericId(
          id,
          (numericId) => prisma.child.update({ where: { id: numericId }, data: payload }),
          (numericId) =>
            prisma.child.create({
              data: {
                ...payload,
                ...(numericId ? { id: numericId } : {}),
              },
            }),
          stats
        );
      } catch (error) {
        stats.skipped += 1;
      }
    }
    return stats;
  },
  employees: async (rows) => {
    const stats = defaultStats();
    for (const row of rows) {
      stats.processed += 1;
      const firstName = getString(row, "First Name", "firstName");
      const lastName = getString(row, "Last Name", "lastName");
      const position = getString(row, "Position", "position");
      const rate = getNumber(row, "Rate", "rate") ?? 1;
      const hireDate = getDate(row, "Hire Date", "hireDate") ?? new Date();
      if (!firstName || !lastName || !position) {
        stats.skipped += 1;
        continue;
      }
      const payload = {
        firstName,
        lastName,
        position,
        rate,
        hireDate,
        contractEndDate: getDate(row, "Contract End Date", "contractEndDate") ?? undefined,
        medicalCheckupDate: getDate(row, "Medical Checkup Date", "medicalCheckupDate") ?? undefined,
      };
      const id = getInt(row, "ID", "id");
      try {
        await upsertByNumericId(
          id,
          (numericId) => prisma.employee.update({ where: { id: numericId }, data: payload }),
          (numericId) =>
            prisma.employee.create({
              data: {
                ...payload,
                ...(numericId ? { id: numericId } : {}),
              },
            }),
          stats
        );
      } catch (error) {
        stats.skipped += 1;
      }
    }
    return stats;
  },
  inventory: async (rows) => {
    const stats = defaultStats();
    for (const row of rows) {
      stats.processed += 1;
      const name = getString(row, "Name", "name");
      const quantity = getNumber(row, "Quantity", "quantity");
      const unit = getString(row, "Unit", "unit");
      if (!name || quantity === undefined || !unit) {
        stats.skipped += 1;
        continue;
      }
      const type =
        (getEnum(row, Object.values(InventoryType), "Type", "type") as InventoryType | undefined) ?? InventoryType.FOOD;
      const payload = {
        name,
        quantity,
        unit,
        type,
        expiryDate: getDate(row, "Expiry Date", "expiryDate") ?? undefined,
        ingredientId: getInt(row, "Ingredient ID", "ingredientId") ?? undefined,
      };
      const id = getInt(row, "ID", "id");
      try {
        await upsertByNumericId(
          id,
          (numericId) => prisma.inventoryItem.update({ where: { id: numericId }, data: payload }),
          (numericId) =>
            prisma.inventoryItem.create({
              data: {
                ...payload,
                ...(numericId ? { id: numericId } : {}),
              },
            }),
          stats
        );
      } catch (error) {
        stats.skipped += 1;
      }
    }
    return stats;
  },
  finance: async (rows) => {
    const stats = defaultStats();
    for (const row of rows) {
      stats.processed += 1;
      const amount = getString(row, "Amount", "amount");
      const type = getEnum(row, Object.values(FinanceType), "Type", "type") as FinanceType | undefined;
      const category = getEnum(row, Object.values(FinanceCategory), "Category", "category") as FinanceCategory | undefined;
      const date = getDate(row, "Date", "date");
      if (!amount || !type || !category || !date) {
        stats.skipped += 1;
        continue;
      }
      const payload = {
        amount: new Prisma.Decimal(amount.replace(/,/g, ".")),
        type,
        category,
        source: (getEnum(row, Object.values(FinanceSource), "Source", "source") as FinanceSource | undefined) ?? FinanceSource.BUDGET,
        description: getString(row, "Description", "description") ?? undefined,
        date,
        clubId: getInt(row, "Club ID", "clubId") ?? undefined,
      };
      const id = getInt(row, "ID", "id");
      try {
        await upsertByNumericId(
          id,
          (numericId) => prisma.financeTransaction.update({ where: { id: numericId }, data: payload }),
          (numericId) =>
            prisma.financeTransaction.create({
              data: {
                ...payload,
                ...(numericId ? { id: numericId } : {}),
              },
            }),
          stats
        );
      } catch (error) {
        stats.skipped += 1;
      }
    }
    return stats;
  },
};

router.get(
  "/export/excel/:entity",
  checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ACCOUNTANT"]),
  validate(exportExcelSchema),
  async (req, res) => {
    const entity = req.params.entity as IntegrationEntity;
    const exporter = entityExporters[entity];
    if (!exporter) {
      return res.status(400).json({ message: "Unknown entity" });
    }

    const rows = await exporter();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, entity.toUpperCase());
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${entity}-export-${new Date().toISOString().split("T")[0]}.xlsx`);
    return res.send(buffer);
  }
);

router.post(
  "/import/excel/:entity",
  checkRole(["DEPUTY", "ADMIN"]),
  validate(importExcelSchema),
  async (req, res) => {
    const entity = req.params.entity as IntegrationEntity;
    const importer = entityImporters[entity];
    if (!importer) {
      return res.status(400).json({ message: "Unknown entity" });
    }

    const fileBase64 = sanitizeBase64(req.body.fileBase64);
    const buffer = Buffer.from(fileBase64, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const [firstSheetName] = workbook.SheetNames;
    if (!firstSheetName) {
      return res.status(400).json({ message: "Не удалось прочитать Excel-файл" });
    }
    const rows = XLSX.utils.sheet_to_json<ImportRow>(workbook.Sheets[firstSheetName], { defval: "" });
    const stats = await importer(rows);
    return res.json({ entity, rows: rows.length, ...stats });
  }
);

router.post(
  "/import/google-sheets",
  checkRole(["DEPUTY", "ADMIN"]),
  validate(importGoogleSheetSchema),
  async (req, res) => {
    const { entity, sheetUrl } = req.body as { entity: IntegrationEntity; sheetUrl: string };
    const importer = entityImporters[entity];
    if (!importer) {
      return res.status(400).json({ message: "Unknown entity" });
    }

    const csvUrl = buildGoogleCsvUrl(sheetUrl);
    const csvText = await fetchCsv(csvUrl);
    const rows = csvTextToRecords<ImportRow>(csvText);
    const stats = await importer(rows);
    return res.json({ entity, source: "google-sheets", rows: rows.length, ...stats });
  }
);

function getString(row: ImportRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null) {
      continue;
    }
    const str = String(value).trim();
    if (str.length) {
      return str;
    }
  }
  return undefined;
}

function getNumber(row: ImportRow, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    const num = typeof value === "number" ? value : Number(String(value).replace(/,/g, "."));
    if (!Number.isNaN(num)) {
      return num;
    }
  }
  return undefined;
}

function getInt(row: ImportRow, ...keys: string[]): number | undefined {
  const num = getNumber(row, ...keys);
  if (num === undefined) {
    return undefined;
  }
  const intVal = Math.trunc(num);
  return Number.isFinite(intVal) ? intVal : undefined;
}

function getDate(row: ImportRow, ...keys: string[]): Date | undefined {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
  return undefined;
}

function getEnum<T extends string>(row: ImportRow, values: readonly T[], ...keys: string[]): T | undefined {
  const str = getString(row, ...keys);
  if (!str) {
    return undefined;
  }
  const normalized = str.replace(/\s+/g, "_").toUpperCase();
  return values.find((value) => value === normalized);
}

async function upsertByNumericId(
  id: number | undefined,
  updateFn: (id: number) => Promise<unknown>,
  createFn: (id?: number) => Promise<unknown>,
  stats: ImportStats
) {
  if (id) {
    try {
      await updateFn(id);
      stats.updated += 1;
      return;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        await createFn(id);
        stats.created += 1;
        return;
      }
      throw error;
    }
  }
  await createFn(undefined);
  stats.created += 1;
}

function sanitizeBase64(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes(",")) {
    return trimmed.split(",").pop() as string;
  }
  return trimmed;
}

function buildGoogleCsvUrl(sheetUrl: string): string {
  try {
    const url = new URL(sheetUrl);
    if (url.pathname.includes("/export")) {
      url.searchParams.set("format", "csv");
      return url.toString();
    }
    if (url.pathname.includes("/edit")) {
      const gidParam = url.searchParams.get("gid") ?? "0";
      const basePath = url.pathname.replace(/\/edit.*/, "");
      url.pathname = `${basePath}/export`;
      url.search = `format=csv&gid=${gidParam}`;
      return url.toString();
    }
    url.searchParams.set("format", "csv");
    return url.toString();
  } catch (error) {
    return sheetUrl;
  }
}

function fetchCsv(targetUrl: string, redirectCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 3) {
      reject(new Error("Too many redirects while fetching Google Sheet"));
      return;
    }
    const client = targetUrl.startsWith("https") ? https : http;
    const req = client.request(targetUrl, { method: "GET", headers: { Accept: "text/csv" } }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, targetUrl).toString();
        req.destroy();
        fetchCsv(nextUrl, redirectCount + 1).then(resolve).catch(reject);
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`Failed to fetch Google Sheet (${res.statusCode ?? "unknown"})`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
    req.on("error", reject);
    req.end();
  });
}

export default router;
