// src/services/InventoryTableService.ts
import * as XLSX from "xlsx";
import { Prisma, InventoryType } from "@prisma/client";
import { prisma } from "../prisma";

export const INVENTORY_TYPE_RU_LABELS: Record<InventoryType, string> = {
  STATIONERY: "Канц. товары",
  HOUSEHOLD: "Хоз. товары",
  FOOD: "Продукты",
  EQUIPMENT: "Техника",
};

export type RowDiffStatus = "UPDATE" | "CREATE" | "UNCHANGED" | "ERROR";

export interface FieldDiff {
  field: string;
  label: string;
  before: any;
  after: any;
  delta?: number;
}

export interface InventoryImportRowResult {
  rowIndex: number;
  status: RowDiffStatus;
  id?: number;
  name: string;
  type: InventoryType;
  typeLabel: string;
  quantity: number;
  quantityBefore?: number;
  quantityDiff?: number;
  unit: string;
  minQuantity: number;
  price: number;
  expiryDate?: string | null;
  matchedByName?: boolean;
  diffs: FieldDiff[];
  errorReason?: string;
}

export interface InventoryImportPreviewResult {
  summary: {
    totalRows: number;
    toUpdate: number;
    toCreate: number;
    unchanged: number;
    errors: number;
    totalQuantityDelta: number;
  };
  rows: InventoryImportRowResult[];
}

/**
 * Очищает и извлекает base64 из строки data URI
 */
export function sanitizeBase64(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes(",")) {
    return trimmed.split(",").pop() as string;
  }
  return trimmed;
}

/**
 * Нормализация и сопоставление категории со складским enum
 */
export function mapCategoryToType(val: unknown, fallback: InventoryType = "HOUSEHOLD"): InventoryType {
  if (!val) return fallback;
  const str = String(val).trim().toLowerCase();

  if (str.includes("канц") || str.includes("stationery") || str.includes("ручк") || str.includes("бумаг")) {
    return "STATIONERY";
  }
  if (str.includes("хоз") || str.includes("household") || str.includes("мыл") || str.includes("быт")) {
    return "HOUSEHOLD";
  }
  if (str.includes("продукт") || str.includes("food") || str.includes("питан") || str.includes("ед")) {
    return "FOOD";
  }
  if (str.includes("техник") || str.includes("оборуд") || str.includes("equipment") || str.includes("электр")) {
    return "EQUIPMENT";
  }

  // Прямое совпадение по enum
  const upper = String(val).trim().toUpperCase();
  if (upper in INVENTORY_TYPE_RU_LABELS) {
    return upper as InventoryType;
  }

  return fallback;
}

/**
 * Гибкий поиск строкового значения по алиасам колонок
 */
function getRowValue(row: Record<string, any>, ...keys: string[]): any {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
    // Регистронезависимый поиск
    const lowerKey = key.toLowerCase();
    for (const [rKey, rVal] of Object.entries(row)) {
      if (rKey.trim().toLowerCase() === lowerKey && rVal !== undefined && rVal !== null && rVal !== "") {
        return rVal;
      }
    }
  }
  return undefined;
}

/**
 * Парсер даты с поддержкой Excel serial numbers, DD.MM.YYYY и ISO
 */
function parseFlexibleDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val;
  }

  // Excel serial number
  if (typeof val === "number" && val > 10000 && val < 100000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    if (!Number.isNaN(date.getTime())) return date;
  }

  const str = String(val).trim();
  if (!str) return null;

  // DD.MM.YYYY
  const dotMatch = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dotMatch) {
    const date = new Date(Number(dotMatch[3]), Number(dotMatch[2]) - 1, Number(dotMatch[1]));
    if (!Number.isNaN(date.getTime())) return date;
  }

  // Стандартный Date
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  return null;
}

/**
 * 1. Генерация Excel файла со всеми товарами склада
 */
export async function generateInventoryExcelBuffer(): Promise<Buffer> {
  const items = await prisma.inventoryItem.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const rows = items.map((item) => ({
    "ID": item.id,
    "Наименование": item.name,
    "Категория": INVENTORY_TYPE_RU_LABELS[item.type] || item.type,
    "Остаток": item.quantity,
    "Ед. изм.": item.unit,
    "Мин. остаток": item.minQuantity,
    "Срок годности": item.expiryDate ? item.expiryDate.toISOString().split("T")[0] : "",
    "Цена (сум)": Number(item.price) || 0,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Устанавливаем ширину колонок для читаемости в Excel
  worksheet["!cols"] = [
    { wch: 8 },  // ID
    { wch: 38 }, // Наименование
    { wch: 18 }, // Категория
    { wch: 12 }, // Остаток
    { wch: 10 }, // Ед. изм.
    { wch: 14 }, // Мин. остаток
    { wch: 15 }, // Срок годности
    { wch: 14 }, // Цена
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Склад ТМЦ");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

/**
 * 2. Анализ и предварительный расчет diff для импорта
 */
export async function parseAndAnalyzeInventoryImport(fileBuffer: Buffer): Promise<InventoryImportPreviewResult> {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const [firstSheetName] = workbook.SheetNames;
  if (!firstSheetName) {
    throw new Error("В файле нет листов с данными");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

  if (rawRows.length === 0) {
    throw new Error("Таблица пуста. Заполните данные и повторите загрузку.");
  }

  // Предзагрузка всех товаров из БД для сверки
  const allDbItems = await prisma.inventoryItem.findMany();
  const itemsById = new Map<number, typeof allDbItems[0]>(allDbItems.map((i) => [i.id, i]));
  const itemsByName = new Map<string, typeof allDbItems[0]>(
    allDbItems.map((i) => [i.name.trim().toLowerCase(), i])
  );

  const results: InventoryImportRowResult[] = [];
  let toUpdate = 0;
  let toCreate = 0;
  let unchanged = 0;
  let errors = 0;
  let totalQuantityDelta = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowIndex = i + 2; // строка в Excel (1-indexed + header)

    // Пропуск полностью пустых строк
    const hasAnyVal = Object.values(row).some((v) => v !== "" && v !== undefined && v !== null);
    if (!hasAnyVal) continue;

    // Извлечение полей с алиасами
    const rawId = getRowValue(row, "ID", "id", "№", "Код");
    const rawName = getRowValue(row, "Наименование", "Название", "Товар", "Name", "name");
    const rawCategory = getRowValue(row, "Категория", "Тип", "Category", "type", "Type");
    const rawQuantity = getRowValue(row, "Остаток", "Количество", "Quantity", "quantity", "Остаток на складе");
    const rawUnit = getRowValue(row, "Ед. изм.", "Ед. изм", "Ед.изм.", "Единица", "Unit", "unit");
    const rawMinQuantity = getRowValue(row, "Мин. остаток", "Мин.остаток", "Минимальный остаток", "MinQuantity", "minQuantity");
    const rawExpiryDate = getRowValue(row, "Срок годности", "Годен до", "Expiry Date", "expiryDate");
    const rawPrice = getRowValue(row, "Цена (сум)", "Цена", "Стоимость", "Price", "price");

    // Валидация наименования
    const name = rawName ? String(rawName).trim() : "";
    if (!name) {
      errors++;
      results.push({
        rowIndex,
        status: "ERROR",
        name: "— (не указано)",
        type: "HOUSEHOLD",
        typeLabel: INVENTORY_TYPE_RU_LABELS.HOUSEHOLD,
        quantity: 0,
        unit: "шт",
        minQuantity: 0,
        price: 0,
        diffs: [],
        errorReason: "Не указано наименование товара",
      });
      continue;
    }

    // Валидация количества
    const parsedQty = typeof rawQuantity === "number" ? rawQuantity : parseFloat(String(rawQuantity).replace(/,/g, "."));
    if (rawQuantity === undefined || rawQuantity === "" || Number.isNaN(parsedQty)) {
      errors++;
      results.push({
        rowIndex,
        status: "ERROR",
        name,
        type: "HOUSEHOLD",
        typeLabel: INVENTORY_TYPE_RU_LABELS.HOUSEHOLD,
        quantity: 0,
        unit: String(rawUnit || "шт"),
        minQuantity: 0,
        price: 0,
        diffs: [],
        errorReason: "Укажите корректный числовой остаток",
      });
      continue;
    }

    if (parsedQty < 0) {
      errors++;
      results.push({
        rowIndex,
        status: "ERROR",
        name,
        type: "HOUSEHOLD",
        typeLabel: INVENTORY_TYPE_RU_LABELS.HOUSEHOLD,
        quantity: parsedQty,
        unit: String(rawUnit || "шт"),
        minQuantity: 0,
        price: 0,
        diffs: [],
        errorReason: `Остаток не может быть отрицательным: ${parsedQty}`,
      });
      continue;
    }

    // Поиск существующего товара
    let parsedId: number | undefined = undefined;
    if (rawId !== undefined && rawId !== "") {
      const numId = Number(rawId);
      if (!Number.isNaN(numId) && numId > 0) {
        parsedId = numId;
      }
    }

    let existingItem = parsedId ? itemsById.get(parsedId) : undefined;
    let matchedByName = false;

    // Если ID был указан, но не найден в базе данных
    if (parsedId && !existingItem) {
      errors++;
      results.push({
        rowIndex,
        status: "ERROR",
        id: parsedId,
        name,
        type: "HOUSEHOLD",
        typeLabel: INVENTORY_TYPE_RU_LABELS.HOUSEHOLD,
        quantity: parsedQty,
        unit: String(rawUnit || "шт"),
        minQuantity: 0,
        price: 0,
        diffs: [],
        errorReason: `Товар с ID #${parsedId} не найден на складе`,
      });
      continue;
    }

    // Если ID не указан — ищем по названию
    if (!existingItem && !parsedId) {
      const match = itemsByName.get(name.toLowerCase());
      if (match) {
        existingItem = match;
        matchedByName = true;
        parsedId = match.id;
      }
    }

    const type = mapCategoryToType(rawCategory, existingItem?.type || "HOUSEHOLD");
    const unit = String(rawUnit || existingItem?.unit || "шт").trim();

    // Мин. остаток: если не указан в строке — сохраняем текущий из БД
    let minQuantity: number;
    if (rawMinQuantity !== undefined && rawMinQuantity !== "") {
      const parsed = typeof rawMinQuantity === "number" ? rawMinQuantity : parseFloat(String(rawMinQuantity).replace(/,/g, "."));
      minQuantity = !Number.isNaN(parsed) && parsed >= 0 ? parsed : (existingItem?.minQuantity || 0);
    } else {
      minQuantity = existingItem?.minQuantity || 0;
    }

    // Цена: если не указана в строке — сохраняем текущую из БД
    let price: number;
    if (rawPrice !== undefined && rawPrice !== "") {
      const parsed = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice).replace(/,/g, "."));
      price = !Number.isNaN(parsed) && parsed >= 0 ? parsed : (Number(existingItem?.price) || 0);
    } else {
      price = Number(existingItem?.price) || 0;
    }

    const parsedDate = parseFlexibleDate(rawExpiryDate);
    const expiryDateStr = parsedDate 
      ? parsedDate.toISOString().split("T")[0] 
      : (rawExpiryDate === "" || rawExpiryDate === undefined 
        ? (existingItem?.expiryDate ? existingItem.expiryDate.toISOString().split("T")[0] : null) 
        : null);

    // Сценарий 1: Существующий товар (UPDATE или UNCHANGED)
    if (existingItem) {
      const diffs: FieldDiff[] = [];
      const quantityDiff = parsedQty - existingItem.quantity;

      if (Math.abs(quantityDiff) > 0.0001) {
        diffs.push({
          field: "quantity",
          label: "Остаток",
          before: existingItem.quantity,
          after: parsedQty,
          delta: quantityDiff,
        });
      }

      if (name !== existingItem.name) {
        diffs.push({
          field: "name",
          label: "Наименование",
          before: existingItem.name,
          after: name,
        });
      }

      if (type !== existingItem.type) {
        diffs.push({
          field: "type",
          label: "Категория",
          before: INVENTORY_TYPE_RU_LABELS[existingItem.type] || existingItem.type,
          after: INVENTORY_TYPE_RU_LABELS[type] || type,
        });
      }

      if (unit !== existingItem.unit) {
        diffs.push({
          field: "unit",
          label: "Ед. изм.",
          before: existingItem.unit,
          after: unit,
        });
      }

      if (Math.abs(minQuantity - existingItem.minQuantity) > 0.0001) {
        diffs.push({
          field: "minQuantity",
          label: "Мин. остаток",
          before: existingItem.minQuantity,
          after: minQuantity,
          delta: minQuantity - existingItem.minQuantity,
        });
      }

      const prevPrice = Number(existingItem.price) || 0;
      if (Math.abs(price - prevPrice) > 0.0001) {
        diffs.push({
          field: "price",
          label: "Цена",
          before: prevPrice,
          after: price,
          delta: price - prevPrice,
        });
      }

      const prevExpiryStr = existingItem.expiryDate ? existingItem.expiryDate.toISOString().split("T")[0] : null;
      if (expiryDateStr !== prevExpiryStr) {
        diffs.push({
          field: "expiryDate",
          label: "Срок годности",
          before: prevExpiryStr || "—",
          after: expiryDateStr || "—",
        });
      }

      if (diffs.length > 0) {
        toUpdate++;
        totalQuantityDelta += quantityDiff;
        results.push({
          rowIndex,
          status: "UPDATE",
          id: existingItem.id,
          name,
          type,
          typeLabel: INVENTORY_TYPE_RU_LABELS[type] || type,
          quantity: parsedQty,
          quantityBefore: existingItem.quantity,
          quantityDiff,
          unit,
          minQuantity,
          price,
          expiryDate: expiryDateStr,
          matchedByName,
          diffs,
        });
      } else {
        unchanged++;
        results.push({
          rowIndex,
          status: "UNCHANGED",
          id: existingItem.id,
          name,
          type,
          typeLabel: INVENTORY_TYPE_RU_LABELS[type] || type,
          quantity: parsedQty,
          quantityBefore: existingItem.quantity,
          quantityDiff: 0,
          unit,
          minQuantity,
          price,
          expiryDate: expiryDateStr,
          diffs: [],
        });
      }
      continue;
    }

    // Сценарий 2: Новый товар (CREATE)
    toCreate++;
    totalQuantityDelta += parsedQty;
    results.push({
      rowIndex,
      status: "CREATE",
      name,
      type,
      typeLabel: INVENTORY_TYPE_RU_LABELS[type] || type,
      quantity: parsedQty,
      quantityBefore: 0,
      quantityDiff: parsedQty,
      unit,
      minQuantity,
      price,
      expiryDate: expiryDateStr,
      diffs: [
        {
          field: "item",
          label: "Новая позиция",
          before: "Отсутствует",
          after: `${name} (${parsedQty} ${unit})`,
          delta: parsedQty,
        },
      ],
    });
  }

  return {
    summary: {
      totalRows: results.length,
      toUpdate,
      toCreate,
      unchanged,
      errors,
      totalQuantityDelta,
    },
    rows: results,
  };
}

/**
 * 3. Применение изменений из таблицы в БД с прозрачной записью в Журнал Движений
 */
export async function applyInventoryImport(
  fileBuffer: Buffer,
  performedById?: number,
  skipErrors = true
): Promise<{ success: boolean; updatedCount: number; createdCount: number; skippedCount: number }> {
  const analysis = await parseAndAnalyzeInventoryImport(fileBuffer);

  if (!skipErrors && analysis.summary.errors > 0) {
    throw new Error(
      `В таблице обнаружено ${analysis.summary.errors} ошибок. Исправьте их или включите пропуск ошибок.`
    );
  }

  const rowsToProcess = analysis.rows.filter((r) => r.status === "UPDATE" || r.status === "CREATE");
  let updatedCount = 0;
  let createdCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rowsToProcess) {
      if (row.status === "UPDATE" && row.id) {
        // Обновляем параметры товара
        await tx.inventoryItem.update({
          where: { id: row.id },
          data: {
            name: row.name,
            quantity: row.quantity,
            unit: row.unit,
            type: row.type,
            minQuantity: row.minQuantity,
            price: new Prisma.Decimal(row.price),
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
          },
        });
        updatedCount++;

        // Если изменился остаток — фиксируем в журнале движения склада
        if (row.quantityDiff && Math.abs(row.quantityDiff) > 0.0001) {
          const qtyBefore = row.quantityBefore ?? 0;
          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId: row.id,
              type: row.quantityDiff > 0 ? "IN" : "ADJUSTMENT",
              quantity: Math.abs(row.quantityDiff),
              quantityBefore: qtyBefore,
              quantityAfter: row.quantity,
              reason: `Импорт таблицы: остаток ${qtyBefore} → ${row.quantity} (${row.quantityDiff > 0 ? `+${row.quantityDiff}` : row.quantityDiff} ${row.unit})`,
              performedById: performedById || null,
            },
          });
        }
      } else if (row.status === "CREATE") {
        // Создаем новый товар
        const created = await tx.inventoryItem.create({
          data: {
            name: row.name,
            quantity: row.quantity,
            unit: row.unit,
            type: row.type,
            minQuantity: row.minQuantity,
            price: new Prisma.Decimal(row.price),
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
          },
        });
        createdCount++;

        // Если у нового товара остаток > 0 — создаем проводку первичного прихода
        if (created.quantity > 0) {
          await tx.inventoryTransaction.create({
            data: {
              inventoryItemId: created.id,
              type: "IN",
              quantity: created.quantity,
              quantityBefore: 0,
              quantityAfter: created.quantity,
              reason: `Первичное оприходование при импорте таблицы (${created.quantity} ${created.unit})`,
              performedById: performedById || null,
            },
          });
        }
      }
    }
  });

  return {
    success: true,
    updatedCount,
    createdCount,
    skippedCount: analysis.summary.unchanged + analysis.summary.errors,
  };
}
