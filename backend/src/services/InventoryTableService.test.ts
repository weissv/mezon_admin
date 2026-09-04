// src/services/InventoryTableService.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import {
  mapCategoryToType,
  sanitizeBase64,
  parseAndAnalyzeInventoryImport,
  generateInventoryExcelBuffer,
  applyInventoryImport,
} from "./InventoryTableService";
import { prisma } from "../prisma";

vi.mock("../prisma", () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    inventoryTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => cb({
      inventoryItem: {
        update: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 101, name: "Новый товар", quantity: 5, unit: "шт" }),
      },
      inventoryTransaction: {
        create: vi.fn(),
      },
    })),
  },
}));

describe("InventoryTableService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("mapCategoryToType", () => {
    it("правильно маппит русские названия категорий", () => {
      expect(mapCategoryToType("Канцтовары")).toBe("STATIONERY");
      expect(mapCategoryToType("Канц. товары")).toBe("STATIONERY");
      expect(mapCategoryToType("Хозтовары")).toBe("HOUSEHOLD");
      expect(mapCategoryToType("Хоз. товары")).toBe("HOUSEHOLD");
      expect(mapCategoryToType("Продукты питания")).toBe("FOOD");
      expect(mapCategoryToType("Техника")).toBe("EQUIPMENT");
      expect(mapCategoryToType("Оборудование")).toBe("EQUIPMENT");
    });

    it("возвращает fallback при неизвестном значении", () => {
      expect(mapCategoryToType("", "HOUSEHOLD")).toBe("HOUSEHOLD");
      expect(mapCategoryToType("Неизвестное", "STATIONERY")).toBe("STATIONERY");
    });
  });

  describe("sanitizeBase64", () => {
    it("удаляет префикс data URI", () => {
      const dataUri = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,QUJDRA==";
      expect(sanitizeBase64(dataUri)).toBe("QUJDRA==");
    });

    it("оставляет чистый base64 без изменений", () => {
      expect(sanitizeBase64("QUJDRA==")).toBe("QUJDRA==");
    });
  });

  describe("parseAndAnalyzeInventoryImport", () => {
    it("корректно рассчитывает diff для обновлений, новых позиций и ошибок", async () => {
      const mockDbItems = [
        {
          id: 1,
          name: "Ручка шариковая синяя",
          type: "STATIONERY",
          quantity: 10,
          unit: "шт",
          minQuantity: 5,
          price: 1500,
          expiryDate: null,
        },
        {
          id: 2,
          name: "Мыло жидкое",
          type: "HOUSEHOLD",
          quantity: 20,
          unit: "л",
          minQuantity: 2,
          price: 8000,
          expiryDate: null,
        },
      ];

      (prisma.inventoryItem.findMany as any).mockResolvedValue(mockDbItems);

      // Создаем виртуальный Excel файл
      const importRows = [
        // 1. Обновление с изменением остатка (10 -> 15)
        {
          "ID": 1,
          "Наименование": "Ручка шариковая синяя",
          "Категория": "Канц. товары",
          "Остаток": 15,
          "Ед. изм.": "шт",
          "Мин. остаток": 5,
        },
        // 2. Без изменений (20 -> 20)
        {
          "ID": 2,
          "Наименование": "Мыло жидкое",
          "Категория": "Хоз. товары",
          "Остаток": 20,
          "Ед. изм.": "л",
          "Мин. остаток": 2,
        },
        // 3. Новый товар (без ID)
        {
          "Наименование": "Тетрадь в клетку 48л",
          "Категория": "Канц. товары",
          "Остаток": 50,
          "Ед. изм.": "шт",
          "Мин. остаток": 10,
        },
        // 4. Ошибка: отрицательный остаток
        {
          "ID": 1,
          "Наименование": "Ручка шариковая синяя",
          "Остаток": -5,
          "Ед. изм.": "шт",
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(importRows);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const result = await parseAndAnalyzeInventoryImport(buffer);

      expect(result.summary.totalRows).toBe(4);
      expect(result.summary.toUpdate).toBe(1);
      expect(result.summary.unchanged).toBe(1);
      expect(result.summary.toCreate).toBe(1);
      expect(result.summary.errors).toBe(1);

      // Проверяем строку обновления
      const updateRow = result.rows.find((r) => r.id === 1 && r.status === "UPDATE");
      expect(updateRow).toBeDefined();
      expect(updateRow?.quantityDiff).toBe(5);
      expect(updateRow?.diffs.some((d) => d.field === "quantity" && d.delta === 5)).toBe(true);

      // Проверяем строку создания
      const createRow = result.rows.find((r) => r.status === "CREATE");
      expect(createRow).toBeDefined();
      expect(createRow?.name).toBe("Тетрадь в клетку 48л");
      expect(createRow?.quantity).toBe(50);

      // Проверяем ошибочную строку
      const errorRow = result.rows.find((r) => r.status === "ERROR");
      expect(errorRow).toBeDefined();
      expect(errorRow?.errorReason).toContain("отрицательным");
    });
  });

  describe("generateInventoryExcelBuffer", () => {
    it("формирует валидный буфер Excel с колонками", async () => {
      (prisma.inventoryItem.findMany as any).mockResolvedValue([
        {
          id: 1,
          name: "Товар 1",
          type: "FOOD",
          quantity: 10,
          unit: "кг",
          minQuantity: 2,
          price: 5000,
          expiryDate: new Date("2026-12-31"),
        },
      ]);

      const buffer = await generateInventoryExcelBuffer();
      expect(buffer).toBeInstanceOf(Buffer);

      const wb = XLSX.read(buffer, { type: "buffer" });
      expect(wb.SheetNames).toContain("Склад ТМЦ");
      const sheet = wb.Sheets["Склад ТМЦ"];
      const json = XLSX.utils.sheet_to_json(sheet);
      expect(json.length).toBe(1);
      expect((json[0] as any)["Наименование"]).toBe("Товар 1");
      expect((json[0] as any)["Категория"]).toBe("Продукты");
    });
  });

  describe("applyInventoryImport", () => {
    it("применяет изменения и создает записи в журнале движения", async () => {
      const mockDbItems = [
        {
          id: 1,
          name: "Товар 1",
          type: "STATIONERY",
          quantity: 10,
          unit: "шт",
          minQuantity: 5,
          price: 1500,
          expiryDate: null,
        },
      ];

      (prisma.inventoryItem.findMany as any).mockResolvedValue(mockDbItems);

      const updateFn = vi.fn();
      const createItemFn = vi.fn().mockResolvedValue({ id: 99, name: "Новый", quantity: 12, unit: "кг" });
      const createTxFn = vi.fn();

      (prisma.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          inventoryItem: {
            update: updateFn,
            create: createItemFn,
          },
          inventoryTransaction: {
            create: createTxFn,
          },
        });
      });

      const importRows = [
        {
          "ID": 1,
          "Наименование": "Товар 1",
          "Категория": "Канц. товары",
          "Остаток": 18, // +8
          "Ед. изм.": "шт",
        },
        {
          "Наименование": "Новый товар",
          "Категория": "Продукты",
          "Остаток": 12,
          "Ед. изм.": "кг",
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(importRows);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const result = await applyInventoryImport(buffer, 42);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(1);
      expect(result.createdCount).toBe(1);

      // Проверяем вызов обновления
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({ quantity: 18 }),
        })
      );

      // Проверяем создание транзакции корректировки для товара 1 (+8)
      expect(createTxFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryItemId: 1,
            type: "IN",
            quantity: 8,
            quantityBefore: 10,
            quantityAfter: 18,
            performedById: 42,
          }),
        })
      );

      // Проверяем создание транзакции прихода для нового товара
      expect(createTxFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryItemId: 99,
            type: "IN",
            quantity: 12,
            quantityBefore: 0,
            quantityAfter: 12,
            performedById: 42,
          }),
        })
      );
    });
  });
});
