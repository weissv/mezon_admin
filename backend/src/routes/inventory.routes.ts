// src/routes/inventory.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { validate } from "../middleware/validate";
import { listInventorySchema, generateShoppingListSchema, createInventorySchema, updateInventorySchema } from "../schemas/inventory.schema";
import {
  createIncomingTransaction,
  createAdjustmentTransaction,
  createWriteOffTransaction,
  getItemTransactions,
  getTransactions,
  getLowStockItems,
} from "../services/InventorySyncService";
import { InventoryTransactionType } from "@prisma/client";
const router = Router();

// GET /api/inventory/search - поиск товаров для автозаполнения
// ВАЖНО: этот маршрут должен быть ДО /:id, чтобы не конфликтовать
router.get("/search", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ", "TEACHER"]), async (req, res) => {
  const query = (req.query.q as string) || "";
  if (!query || query.trim().length < 1) {
    return res.json([]);
  }
  
  const items = await prisma.inventoryItem.findMany({
    where: {
      name: {
        contains: query.trim(),
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      unit: true,
      quantity: true, // Добавляем остаток для отображения при выборе
      type: true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });
  
  return res.json(items);
});

// GET /api/inventory/transactions - журнал движений склада
router.get("/transactions", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { type, itemId, startDate, endDate, limit } = req.query;
  
  const transactions = await getTransactions({
    type: type as InventoryTransactionType | undefined,
    inventoryItemId: itemId ? Number(itemId) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    limit: limit ? Number(limit) : 100,
  });
  
  return res.json(transactions);
});

// GET /api/inventory/low-stock - товары с низким остатком
router.get("/low-stock", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
  const items = await getLowStockItems();
  return res.json(items);
});

// =====================================================
// ИНВЕНТАРИЗАЦИЯ СКЛАДА
// =====================================================

async function generateAuditNumber(): Promise<string> {
  const now = new Date();
  const prefix = `AUD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastAudit = await prisma.inventoryAudit.findFirst({
    where: { auditNumber: { startsWith: prefix } },
    orderBy: { auditNumber: "desc" },
    select: { auditNumber: true },
  });

  let seq = 1;
  if (lastAudit) {
    const parts = lastAudit.auditNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(4, "0")}`;
}

// GET /api/inventory/audits - список всех актов инвентаризации
router.get("/audits", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
  const audits = await prisma.inventoryAudit.findMany({
    include: {
      performedBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(audits);
});

// GET /api/inventory/audits/:id - детализация акта инвентаризации
router.get("/audits/:id", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const audit = await prisma.inventoryAudit.findUnique({
    where: { id },
    include: {
      performedBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          inventoryItem: {
            select: { id: true, name: true, unit: true, quantity: true, type: true },
          },
        },
        orderBy: { inventoryItem: { name: "asc" } },
      },
    },
  });

  if (!audit) return res.status(404).json({ message: "Акт инвентаризации не найден" });
  return res.json(audit);
});

// POST /api/inventory/audits - создание нового акта инвентаризации
router.post("/audits", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { notes, type } = req.body;
  const user = req.user;

  const whereFilter: any = {};
  if (type && ["FOOD", "HOUSEHOLD", "STATIONERY", "EQUIPMENT"].includes(type)) {
    whereFilter.type = type;
  }

  const items = await prisma.inventoryItem.findMany({
    where: whereFilter,
    orderBy: { name: "asc" },
  });

  if (items.length === 0) {
    return res.status(400).json({ message: "Нет товаров на складе для проведения инвентаризации" });
  }

  const auditNumber = await generateAuditNumber();

  const audit = await prisma.inventoryAudit.create({
    data: {
      auditNumber,
      notes: notes || null,
      status: "DRAFT",
      performedById: user?.employeeId || null,
      items: {
        create: items.map((item) => ({
          inventoryItemId: item.id,
          expectedQuantity: item.quantity,
          actualQuantity: item.quantity,
          variance: 0,
        })),
      },
    },
    include: {
      performedBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          inventoryItem: { select: { id: true, name: true, unit: true, quantity: true, type: true } },
        },
      },
    },
  });

  return res.status(201).json(audit);
});

// PUT /api/inventory/audits/:id - обновление данных черновика инвентаризации
router.put("/audits/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const { notes, items } = req.body as {
    notes?: string;
    items?: Array<{ inventoryItemId: number; actualQuantity?: number | null; notes?: string }>;
  };

  const audit = await prisma.inventoryAudit.findUnique({ where: { id } });
  if (!audit) return res.status(404).json({ message: "Акт не найден" });
  if (audit.status !== "DRAFT") {
    return res.status(400).json({ message: "Изменять можно только черновик инвентаризации" });
  }

  await prisma.$transaction(async (tx) => {
    if (notes !== undefined) {
      await tx.inventoryAudit.update({ where: { id }, data: { notes } });
    }

    if (items && Array.isArray(items)) {
      for (const itemInput of items) {
        const auditItem = await tx.inventoryAuditItem.findFirst({
          where: { auditId: id, inventoryItemId: itemInput.inventoryItemId },
        });

        if (auditItem) {
          const actualQty = itemInput.actualQuantity !== undefined && itemInput.actualQuantity !== null
            ? Number(itemInput.actualQuantity)
            : auditItem.expectedQuantity;
          const variance = actualQty - auditItem.expectedQuantity;

          await tx.inventoryAuditItem.update({
            where: { id: auditItem.id },
            data: {
              actualQuantity: actualQty,
              variance: Math.round(variance * 100) / 100,
              notes: itemInput.notes !== undefined ? itemInput.notes : auditItem.notes,
            },
          });
        }
      }
    }
  });

  const updated = await prisma.inventoryAudit.findUnique({
    where: { id },
    include: {
      performedBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          inventoryItem: { select: { id: true, name: true, unit: true, quantity: true, type: true } },
        },
        orderBy: { inventoryItem: { name: "asc" } },
      },
    },
  });

  return res.json(updated);
});

// POST /api/inventory/audits/:id/complete - проведение инвентаризации (применение результатов)
router.post("/audits/:id/complete", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const audit = await prisma.inventoryAudit.findUnique({
    where: { id },
    include: { items: { include: { inventoryItem: true } } },
  });

  if (!audit) return res.status(404).json({ message: "Акт инвентаризации не найден" });
  if (audit.status !== "DRAFT") {
    return res.status(400).json({ message: "Инвентаризация уже проведена или отменена" });
  }

  const user = req.user;

  const resultSummary = {
    surplusesCount: 0,
    deficitsCount: 0,
    matchedCount: 0,
  };

  await prisma.$transaction(async (tx) => {
    for (const item of audit.items) {
      const actual = item.actualQuantity ?? item.expectedQuantity;
      const variance = Math.round((actual - item.expectedQuantity) * 100) / 100;

      if (variance === 0) {
        resultSummary.matchedCount++;
      } else if (variance > 0) {
        resultSummary.surplusesCount++;
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: actual },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            type: "IN",
            quantity: variance,
            quantityBefore: item.expectedQuantity,
            quantityAfter: actual,
            reason: `Инвентаризация #${audit.auditNumber}: излишек (+${variance} ${item.inventoryItem.unit})`,
            performedById: user?.employeeId || null,
          },
        });
      } else {
        resultSummary.deficitsCount++;
        const deficitQty = Math.abs(variance);
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: actual },
        });

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            type: "WRITE_OFF",
            quantity: deficitQty,
            quantityBefore: item.expectedQuantity,
            quantityAfter: actual,
            reason: `Инвентаризация #${audit.auditNumber}: недостача (-${deficitQty} ${item.inventoryItem.unit})`,
            performedById: user?.employeeId || null,
          },
        });
      }
    }

    await tx.inventoryAudit.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  });

  const completedAudit = await prisma.inventoryAudit.findUnique({
    where: { id },
    include: {
      performedBy: { select: { id: true, firstName: true, lastName: true } },
      items: {
        include: {
          inventoryItem: { select: { id: true, name: true, unit: true, quantity: true, type: true } },
        },
      },
    },
  });

  return res.json({ audit: completedAudit, summary: resultSummary });
});

// POST /api/inventory/audits/:id/cancel - отмена акта инвентаризации
router.post("/audits/:id/cancel", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid id" });

  const audit = await prisma.inventoryAudit.findUnique({ where: { id } });
  if (!audit) return res.status(404).json({ message: "Акт не найден" });
  if (audit.status !== "DRAFT") {
    return res.status(400).json({ message: "Отменить можно только черновик инвентаризации" });
  }

  const cancelled = await prisma.inventoryAudit.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return res.json(cancelled);
});

// GET /api/inventory
router.get("/", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ", "TEACHER", "ACCOUNTANT"]), async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  return res.json(items);
});

// GET /api/inventory/:id/transactions - история движений конкретного товара
router.get("/:id/transactions", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const transactions = await getItemTransactions(id);
  return res.json(transactions);
});

// POST /api/inventory - создание товара (с записью транзакции прихода)
router.post("/", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), validate(createInventorySchema), async (req, res) => {
  const { name, quantity, unit, expiryDate, type, minQuantity } = req.body;
  const user = req.user;
  
  const item = await prisma.inventoryItem.create({
    data: {
      name,
      quantity,
      unit,
      minQuantity: minQuantity ?? 0,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      type: type || "FOOD",
    },
  });

  // Создаём транзакцию прихода
  if (quantity > 0) {
    await createIncomingTransaction(
      item.id,
      quantity,
      user?.employeeId,
      "Первичное добавление на склад"
    );
  }

  return res.status(201).json(item);
});

// PUT /api/inventory/:id - обновление товара (с записью транзакции корректировки)
router.put("/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), validate(updateInventorySchema), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const { name, quantity, unit, expiryDate, type, minQuantity } = req.body;
  const user = req.user;

  // Получаем текущее количество для записи транзакции
  const currentItem = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!currentItem) {
    return res.status(404).json({ message: "Товар не найден" });
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name,
      quantity,
      unit,
      minQuantity,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      type,
    },
  });

  // Если количество изменилось — создаём транзакцию корректировки
  if (quantity !== undefined && quantity !== currentItem.quantity) {
    await createAdjustmentTransaction(
      id,
      currentItem.quantity,
      quantity,
      user?.employeeId,
      `Ручная корректировка: ${currentItem.quantity} → ${quantity}`
    );
  }

  return res.json(item);
});

// POST /api/inventory/:id/write-off - списание товара
router.post("/:id/write-off", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const { quantity, reason } = req.body;
  const user = req.user;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Количество списания должно быть положительным" });
  }

  const currentItem = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!currentItem) {
    return res.status(404).json({ message: "Товар не найден" });
  }

  if (quantity > currentItem.quantity) {
    return res.status(400).json({ message: `Недостаточно на складе. Остаток: ${currentItem.quantity} ${currentItem.unit}` });
  }

  const newQuantity = currentItem.quantity - quantity;

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: { quantity: newQuantity },
  });

  await createWriteOffTransaction(
    id,
    quantity,
    currentItem.quantity,
    user?.employeeId,
    reason || "Списание"
  );

  return res.json(updated);
});

// POST /api/inventory/:id/receive - приёмка товара (приход)
router.post("/:id/receive", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  const { quantity, reason } = req.body;
  const user = req.user;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Количество прихода должно быть положительным" });
  }

  const currentItem = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!currentItem) {
    return res.status(404).json({ message: "Товар не найден" });
  }

  const newQuantity = currentItem.quantity + quantity;

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: { quantity: newQuantity },
  });

  await createIncomingTransaction(
    id,
    quantity,
    user?.employeeId,
    reason || "Приёмка товара"
  );

  // Обновляем quantityBefore/After в последней транзакции (createIncomingTransaction ставит 0/quantity)
  const lastTx = await prisma.inventoryTransaction.findFirst({
    where: { inventoryItemId: id },
    orderBy: { createdAt: "desc" },
  });
  if (lastTx) {
    await prisma.inventoryTransaction.update({
      where: { id: lastTx.id },
      data: {
        quantityBefore: currentItem.quantity,
        quantityAfter: newQuantity,
      },
    });
  }

  return res.json(updated);
});

// DELETE /api/inventory/:id - удаление товара со склада (с записью списания)
router.delete("/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  
  const user = req.user;

  try {
    const currentItem = await prisma.inventoryItem.findUnique({ where: { id } });
    if (currentItem && currentItem.quantity > 0) {
      // Записываем списание перед удалением
      await createWriteOffTransaction(
        id,
        currentItem.quantity,
        currentItem.quantity,
        user?.employeeId,
        "Удаление товара со склада"
      );
    }
    
    // Удаляем связанные транзакции и сам товар
    await prisma.inventoryTransaction.deleteMany({ where: { inventoryItemId: id } });
    await prisma.inventoryItem.delete({ where: { id } });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(204).send();
    }
    throw error;
  }
  return res.status(204).send();
});

// POST /api/inventory/generate-shopping-list
// TODO: Cron job для проверки сроков годности и создания уведомлений.
router.post("/generate-shopping-list", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), validate(generateShoppingListSchema), async (req, res) => {
  // Вход: { startDate, endDate }
  // Бизнес-логика: суммировать блюда из меню через MenuDish -> Dish -> DishIngredient -> Ingredient, сопоставить с остатками
  const { startDate, endDate } = req.body as { startDate: string; endDate: string };
  const menus = await prisma.menu.findMany({
    where: { date: { gte: new Date(startDate), lte: new Date(endDate) } },
    include: {
      meals: {
        include: {
          dish: {
            include: {
              ingredients: {
                include: {
                  inventoryItem: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Суммируем требуемые ингредиенты из всех блюд
  const required: Record<string, { qty: number; unit: string }> = {};
  for (const menu of menus) {
    for (const menuDish of menu.meals) {
      const dish = menuDish.dish;
      for (const dishIng of dish.ingredients) {
        const ing = dishIng.inventoryItem;
        if (!ing) continue;
        const key = `${ing.name}|${ing.unit}`;
        required[key] = required[key] || { qty: 0, unit: ing.unit };
        required[key].qty += dishIng.quantity;
      }
    }
  }

  const inventory = await prisma.inventoryItem.findMany();
  
  const shoppingList = Object.entries(required).map(([key, val]) => {
    const [name, unit] = key.split("|");
    const stock = inventory.find((i) => 
      i.name === name && i.unit === unit
    );
    const remaining = (val.qty - (stock?.quantity || 0));
    return { name, unit, requiredQty: val.qty, inStock: stock?.quantity || 0, toBuy: Math.max(remaining, 0) };
  });

  return res.json({ data: { period: { startDate, endDate }, items: shoppingList } });
});
export default router;
