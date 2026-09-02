// src/routes/maintenance.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
const router = Router();
import { validate } from "../middleware/validate";
import { createMaintenanceSchema, updateMaintenanceSchema, fulfillMaintenanceSchema } from "../schemas/maintenance.schema";
import { notifyRole, sendTelegramMessage } from "../services/TelegramService";
import {
  checkStockAvailability,
  deductStockForRequest,
  reverseStockForRequest,
} from "../services/InventorySyncService";

// Helper for mapping inventory type to maintenance item category
function mapInventoryTypeToCategory(type?: string): "STATIONERY" | "HOUSEHOLD" | "OTHER" {
  if (type === "STATIONERY") return "STATIONERY";
  if (type === "HOUSEHOLD") return "HOUSEHOLD";
  return "OTHER";
}

// GET /api/maintenance - получить заявки с учетом роли
router.get("/", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ZAVHOZ", "ACCOUNTANT"]), async (req, res) => {
  const user = req.user!;
  const userRole = user.role;
  
  let whereClause: any = {};
  
  // DEVELOPER видит всё
  if (userRole === "DEVELOPER") {
    whereClause = {};
  }
  // ZAVHOZ видит все заявки (включая PENDING)
  else if (userRole === "ZAVHOZ") {
    whereClause = {};
  }
  // DIRECTOR видит все заявки от НЕ-учителей + все свои заявки
  else if (userRole === "DIRECTOR") {
    whereClause = {
      OR: [
        {
          requester: {
            user: {
              role: { not: "TEACHER" }
            }
          }
        },
        { requesterId: user.employeeId }
      ]
    };
  }
  // DEPUTY (Завуч) видит PENDING заявки от учителей + все свои заявки
  else if (userRole === "DEPUTY") {
    whereClause = {
      OR: [
        {
          status: "PENDING",
          requester: {
            user: {
              role: "TEACHER"
            }
          }
        },
        { requesterId: user.employeeId }
      ]
    };
  }
  // TEACHER видит только свои заявки
  else if (userRole === "TEACHER") {
    whereClause = {
      requesterId: user.employeeId
    };
  }
  // ADMIN видит все (на всякий случай)
  else if (userRole === "ADMIN") {
    whereClause = {};
  }
  // Все остальные (включая ACCOUNTANT) видят только свои заявки
  else {
    whereClause = {
      requesterId: user.employeeId
    };
  }
  
  const items = await prisma.maintenanceRequest.findMany({
    where: whereClause,
    include: { 
      requester: {
        include: {
          user: {
            select: { role: true }
          }
        }
      },
      approvedBy: {
        select: { id: true, firstName: true, lastName: true }
      },
      receivedBy: {
        select: { id: true, firstName: true, lastName: true }
      },
      items: {
        include: {
          inventoryItem: {
            select: { id: true, name: true, quantity: true, unit: true, type: true }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
  
  res.json(items);
});

router.post("/", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ZAVHOZ", "ACCOUNTANT"]), validate(createMaintenanceSchema), async (req, res) => {
  const { items, ...data } = req.body;
  const user = req.user!;

  // Для заявок на выдачу (ISSUE) проверяем, что ни один выбранный товар не имеет нулевой остаток
  if (data.type === "ISSUE" && items && items.length > 0) {
    for (const item of items) {
      if (item.inventoryItemId) {
        const invItem = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
        if (!invItem || invItem.quantity <= 0) {
          return res.status(400).json({
            message: `Товар "${invItem?.name || item.name}" отсутствует на складе (остаток 0). Пожалуйста, оформите заявку на покупку.`,
          });
        }
      }
    }
  }

  // Обрабатываем позиции: если передан inventoryItemId, берем канонические данные со склада
  let processedItems: Array<{ name: string; quantity: number; unit: string; category: "STATIONERY" | "HOUSEHOLD" | "OTHER"; inventoryItemId?: number | null }> = [];
  if (items && items.length > 0) {
    processedItems = await Promise.all(
      items.map(async (item: { name: string; quantity: number; unit: string; category: string; inventoryItemId?: number }) => {
        if (item.inventoryItemId) {
          const invItem = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
          if (invItem) {
            return {
              name: invItem.name,
              quantity: item.quantity,
              unit: invItem.unit,
              category: mapInventoryTypeToCategory(invItem.type),
              inventoryItemId: invItem.id,
            };
          }
        }
        return {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: (item.category as any) || "OTHER",
          inventoryItemId: item.inventoryItemId || null,
        };
      })
    );
  }
  
  const created = await prisma.maintenanceRequest.create({
    data: { 
      ...data, 
      requesterId: user.employeeId,
      status: "PENDING", // Все новые заявки начинаются с PENDING
      // Nested write для создания позиций с привязкой к складу
      items: processedItems.length > 0 ? {
        create: processedItems
      } : undefined
    },
    include: {
      requester: true,
      items: {
        include: {
          inventoryItem: {
            select: { id: true, name: true, quantity: true, unit: true }
          }
        }
      }
    }
  });

  // 📱 Telegram уведомление о новой заявке
  try {
    const requesterName = `${created.requester.firstName} ${created.requester.lastName}`;
    const requestTitle = created.title || `Заявка #${created.id}`;
    const typeLabel = created.type === "PURCHASE" ? "на покупку" : created.type === "ISSUE" ? "на выдачу ТМЦ" : "на ремонт";
    const typeIcon = created.type === "PURCHASE" ? "🛒" : created.type === "ISSUE" ? "📦" : "🔧";
    
    if (user.role === 'TEACHER') {
      // Учитель -> уведомляем Завуча (DEPUTY)
      await notifyRole('DEPUTY', 
        `${typeIcon} <b>Новая заявка ${typeLabel} от учителя</b>\n\n` +
        `👤 От: ${requesterName}\n` +
        `📝 Тема: ${requestTitle}\n` +
        `🔢 ID заявки: #${created.id}`
      );
    } else {
      // Не учитель -> уведомляем Директора
      await notifyRole('DIRECTOR', 
        `${typeIcon} <b>Новая заявка ${typeLabel}</b>\n\n` +
        `👤 От: ${requesterName} (${user.role})\n` +
        `📝 Тема: ${requestTitle}\n` +
        `🔢 ID заявки: #${created.id}`
      );
    }
  } catch (error) {
    console.error('Ошибка отправки Telegram уведомления:', error);
  }

  res.status(201).json(created);
});

router.put("/:id", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ZAVHOZ"]), validate(updateMaintenanceSchema), async (req, res) => {
  const id = Number(req.params.id);
  const user = req.user!;
  
  // Проверяем права на редактирование
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      requester: {
        include: {
          user: { select: { role: true } }
        }
      }
    }
  });
  
  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }
  
  // Учитель не может редактировать одобренную, выполненную или завершенную заявку
  if (user.role === "TEACHER" && (request.status === "APPROVED" || request.status === "DONE" || request.status === "COMPLETED")) {
    return res.status(403).json({ message: "Нельзя редактировать согласованную или выполненную заявку" });
  }
  
  // Завхоз, Директор, Завуч, Админ и Разработчик имеют право редактировать заявки
  // (исправлять позиции, удалять, добавлять новые со склада или вручную, менять количество и статус)
  
  const { items, ...updateData } = req.body;
  const previousStatus = request.status;
  const newStatus = updateData.status;
  
  // Проверка: если переход в DONE для ISSUE — проверяем остатки на складе
  if (newStatus === "DONE" && previousStatus !== "DONE" && request.type === "ISSUE") {
    const stockCheck = await checkStockAvailability(id);
    if (!stockCheck.available) {
      const deficits = stockCheck.items
        .filter(i => i.deficit > 0)
        .map(i => `${i.name}: запрошено ${i.requested} ${i.unit}, на складе ${i.inStock} ${i.unit}`)
        .join("; ");
      // Не блокируем, но предупреждаем (частичная выдача допустима)
      console.warn(`Недостаточно товаров на складе для заявки #${id}: ${deficits}`);
    }
  }
  
  // Если заявка была DONE и переводится обратно — возвращаем товары на склад
  if (previousStatus === "DONE" && newStatus && newStatus !== "DONE" && request.type === "ISSUE") {
    await reverseStockForRequest(id, user.employeeId);
  }

  // Обрабатываем позиции при обновлении
  let processedItems: Array<{ name: string; quantity: number; unit: string; category: "STATIONERY" | "HOUSEHOLD" | "OTHER"; inventoryItemId?: number | null }> | undefined = undefined;
  if (items && Array.isArray(items)) {
    processedItems = await Promise.all(
      items.map(async (item: { name: string; quantity: number; unit: string; category: string; inventoryItemId?: number }) => {
        if (item.inventoryItemId) {
          const invItem = await prisma.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
          if (invItem) {
            return {
              name: invItem.name,
              quantity: item.quantity,
              unit: invItem.unit,
              category: mapInventoryTypeToCategory(invItem.type),
              inventoryItemId: invItem.id,
            };
          }
        }
        return {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: (item.category as any) || "OTHER",
          inventoryItemId: item.inventoryItemId || null,
        };
      })
    );
  }
  
  // Если items передан, делаем полную замену позиций
  const updated = await prisma.maintenanceRequest.update({ 
    where: { id }, 
    data: {
      ...updateData,
      // Если items передан, удаляем старые и создаем новые
      items: processedItems ? {
        deleteMany: {}, // Удаляем все старые позиции
        create: processedItems
      } : undefined
    },
    include: {
      requester: {
        include: {
          user: { select: { id: true } }
        }
      },
      approvedBy: true,
      items: {
        include: {
          inventoryItem: {
            select: { id: true, name: true, quantity: true, unit: true }
          }
        }
      }
    }
  });

  // 📦 Синхронизация со складом: списание при DONE
  let stockResult = null;
  if (newStatus === "DONE" && previousStatus !== "DONE" && request.type === "ISSUE") {
    stockResult = await deductStockForRequest(id, user.employeeId);
    if (stockResult.warnings.length > 0) {
      console.warn(`Предупреждения при списании для заявки #${id}:`, stockResult.warnings);
    }
  }

  // 📱 Telegram уведомление заявителю при завершении заявки
  if (updated.status === 'DONE' && previousStatus !== 'DONE') {
    try {
      const requesterId = updated.requester.user?.id;
      if (requesterId) {
        const requestTitle = updated.title || `Заявка #${updated.id}`;
        let message = `✅ <b>Заявка выполнена!</b>\n\n` +
          `🔢 ID заявки: #${updated.id}\n` +
          `📝 Тема: ${requestTitle}\n\n`;
        
        // Добавляем информацию о списании со склада
        if (stockResult && stockResult.transactions.length > 0) {
          message += `📦 <b>Списано со склада:</b>\n`;
          for (const tx of stockResult.transactions) {
            message += `  • ${tx.itemName}: ${tx.deducted}, остаток: ${tx.remainingStock}\n`;
          }
          if (stockResult.warnings.length > 0) {
            message += `\n⚠️ <b>Предупреждения:</b>\n`;
            for (const w of stockResult.warnings) {
              message += `  • ${w}\n`;
            }
          }
        }
        
        message += `\nВаша заявка была успешно выполнена.`;
        await sendTelegramMessage(requesterId, message);
      }
    } catch (error) {
      console.error('Ошибка отправки Telegram уведомления:', error);
    }
  }

  // Возвращаем результат с информацией о складских операциях
  const response: any = updated;
  if (stockResult) {
    response.stockDeduction = stockResult;
  }

  res.json(response);
});

// POST /api/maintenance/:id/fulfill - частичная или полная выдача завхозом
router.post("/:id/fulfill", checkRole(["DEVELOPER", "DIRECTOR", "ADMIN", "ZAVHOZ"]), validate(fulfillMaintenanceSchema), async (req, res) => {
  const id = Number(req.params.id);
  const user = req.user!;
  const { issuedItems } = req.body;

  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      items: true,
      requester: {
        include: {
          user: { select: { id: true } }
        }
      }
    }
  });

  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }

  if (request.type !== "ISSUE") {
    return res.status(400).json({ message: "Выдача доступна только для заявок на выдачу (ISSUE)" });
  }

  if (request.status !== "APPROVED" && request.status !== "IN_PROGRESS") {
    return res.status(400).json({ message: "Выдавать можно только одобренные заявки или заявки в работе" });
  }

  // Списываем товары со склада с учетом переданных количеств
  const stockResult = await deductStockForRequest(id, user.employeeId, issuedItems);

  // Переводим заявку в статус DONE
  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: "DONE",
    },
    include: {
      requester: {
        include: {
          user: { select: { id: true, role: true } }
        }
      },
      approvedBy: true,
      receivedBy: true,
      items: {
        include: {
          inventoryItem: {
            select: { id: true, name: true, quantity: true, unit: true, type: true }
          }
        }
      }
    }
  });

  // Проверяем, частичная ли выдача
  const isPartial = updated.items.some(
    (item) => (item.issuedQuantity ?? 0) < item.quantity
  );

  // 📱 Telegram уведомление заявителю о выдаче
  try {
    const requesterId = updated.requester.user?.id;
    if (requesterId) {
      const requestTitle = updated.title || `Заявка #${updated.id}`;
      let message = isPartial
        ? `⚠️ <b>Заявка выполнена ЧАСТИЧНО</b>\n\n`
        : `✅ <b>Заявка выполнена полностью!</b>\n\n`;
      
      message += `🔢 ID заявки: #${updated.id}\n` +
        `📝 Тема: ${requestTitle}\n\n` +
        `📦 <b>Выдано со склада:</b>\n`;
      
      for (const item of updated.items) {
        const issued = item.issuedQuantity ?? 0;
        if (issued < item.quantity) {
          message += `  • ${item.name}: <b>${issued}</b> из ${item.quantity} ${item.unit} (недостача: ${item.quantity - issued} ${item.unit})\n`;
        } else {
          message += `  • ${item.name}: <b>${issued}</b> ${item.unit} (выдано полностью)\n`;
        }
      }

      message += isPartial
        ? `\n<i>Пожалуйста, подтвердите получение выданной части товаров.</i>`
        : `\n<i>Пожалуйста, подтвердите получение товаров.</i>`;

      await sendTelegramMessage(requesterId, message);
    }
  } catch (error) {
    console.error('Ошибка отправки Telegram уведомления:', error);
  }

  const response: any = updated;
  response.stockDeduction = stockResult;
  response.isPartial = isPartial;

  return res.json(response);
});

// GET /api/maintenance/:id/stock-check - проверка наличия товаров на складе для заявки ISSUE
router.get("/:id/stock-check", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    select: { type: true },
  });
  
  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }
  
  if (request.type !== "ISSUE") {
    return res.json({ available: true, items: [], message: "Проверка только для заявок на выдачу" });
  }
  
  const result = await checkStockAvailability(id);
  return res.json(result);
});

// POST /api/maintenance/:id/approve - одобрить заявку
router.post("/:id/approve", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY"]), async (req, res) => {
  const id = Number(req.params.id);
  const user = req.user!;
  
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      requester: {
        include: {
          user: { select: { role: true } }
        }
      }
    }
  });
  
  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }
  
  // Проверяем права на одобрение
  const requesterRole = request.requester.user?.role;
  
  // Завуч может одобрять только заявки учителей
  if (user.role === "DEPUTY" && requesterRole !== "TEACHER") {
    return res.status(403).json({ message: "Вы можете одобрять только заявки учителей" });
  }
  
  // Директор не может одобрять заявки учителей
  if (user.role === "DIRECTOR" && requesterRole === "TEACHER") {
    return res.status(403).json({ message: "Заявки учителей одобряет завуч" });
  }
  
  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: user.employeeId,
      approvedAt: new Date(),
      rejectionReason: null
    },
    include: {
      requester: true,
      approvedBy: true
    }
  });

  // 📱 Telegram уведомление Завхозу об одобренной заявке
  try {
    const requestTitle = updated.title || `Заявка #${updated.id}`;
    const typeLabel = updated.type === "PURCHASE" ? "на покупку" : updated.type === "ISSUE" ? "на выдачу ТМЦ" : "на ремонт";
    const typeAction = updated.type === "PURCHASE" ? "Готова к закупке" : updated.type === "ISSUE" ? "Готова к выдаче со склада" : "Готова к выполнению";
    const typeIcon = updated.type === "PURCHASE" ? "🛒" : updated.type === "ISSUE" ? "📦" : "🔧";
    
    await notifyRole('ZAVHOZ', 
      `${typeIcon} <b>Заявка ${typeLabel} одобрена</b>\n\n` +
      `🔢 ID заявки: #${updated.id}\n` +
      `📝 Тема: ${requestTitle}\n` +
      `👤 От: ${updated.requester.firstName} ${updated.requester.lastName}\n\n` +
      `⚡ ${typeAction}`
    );
  } catch (error) {
    console.error('Ошибка отправки Telegram уведомления:', error);
  }
  
  res.json(updated);
});

// POST /api/maintenance/:id/reject - отклонить заявку
router.post("/:id/reject", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY"]), async (req, res) => {
  const id = Number(req.params.id);
  const { reason } = req.body;
  const user = req.user!;
  
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      requester: {
        include: {
          user: { select: { role: true } }
        }
      }
    }
  });
  
  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }
  
  // Проверяем права на отклонение (аналогично одобрению)
  const requesterRole = request.requester.user?.role;
  
  if (user.role === "DEPUTY" && requesterRole !== "TEACHER") {
    return res.status(403).json({ message: "Вы можете отклонять только заявки учителей" });
  }
  
  if (user.role === "DIRECTOR" && requesterRole === "TEACHER") {
    return res.status(403).json({ message: "Заявки учителей обрабатывает завуч" });
  }
  
  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: "REJECTED",
      approvedById: user.employeeId,
      approvedAt: new Date(),
      rejectionReason: reason || null
    },
    include: {
      requester: true,
      approvedBy: true
    }
  });
  
  res.json(updated);
});

// POST /api/maintenance/:id/confirm-receipt - подтвердить получение
router.post("/:id/confirm-receipt", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ZAVHOZ", "ACCOUNTANT"]), async (req, res) => {
  const id = Number(req.params.id);
  const user = req.user!;
  
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { requester: true }
  });
  
  if (!request) {
    return res.status(404).json({ message: "Заявка не найдена" });
  }
  
  if (request.status !== "DONE") {
    return res.status(400).json({ message: "Заявка еще не выдана (не DONE)" });
  }
  
  // Только создатель может подтвердить получение
  if (request.requesterId !== user.employeeId && user.role !== "DEVELOPER" && user.role !== "ADMIN") {
    return res.status(403).json({ message: "Только создатель заявки может подтвердить получение" });
  }
  
  const updated = await prisma.maintenanceRequest.update({
    where: { id },
    data: {
      status: "COMPLETED",
      receivedById: user.employeeId,
      receivedAt: new Date(),
    },
    include: {
      requester: true,
      receivedBy: true
    }
  });
  
  res.json(updated);
});

// DELETE /api/maintenance/:id - удаление заявки
router.delete("/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    await prisma.maintenanceRequest.delete({ where: { id } });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(204).send();
    }
    throw error;
  }
  return res.status(204).send();
});

// --- CleaningSchedule CRUD ---

// GET /api/maintenance/cleaning - список графиков уборки
router.get("/cleaning", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
  const schedules = await prisma.cleaningSchedule.findMany({
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
      logs: {
        orderBy: { timestamp: "desc" },
        take: 5,
      },
    },
    orderBy: { area: "asc" },
  });
  
  return res.json(schedules);
});

// POST /api/maintenance/cleaning - создать график уборки
router.post("/cleaning", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { area, frequency, assignedToId } = req.body;
  
  const schedule = await prisma.cleaningSchedule.create({
    data: {
      area,
      frequency,
      assignedToId: assignedToId || null,
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  
  return res.status(201).json(schedule);
});

// PUT /api/maintenance/cleaning/:id - обновить график
router.put("/cleaning/:id", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  const { area, frequency, assignedToId } = req.body;
  
  const schedule = await prisma.cleaningSchedule.update({
    where: { id: Number(id) },
    data: { area, frequency, assignedToId },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  
  return res.json(schedule);
});

// DELETE /api/maintenance/cleaning/:id
router.delete("/cleaning/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  await prisma.cleaningSchedule.delete({ where: { id: Number(id) } });
  return res.status(204).send();
});

// POST /api/maintenance/cleaning/:id/log - отметить выполнение уборки
router.post("/cleaning/:id/log", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  
  const log = await prisma.cleaningLog.create({
    data: {
      scheduleId: Number(id),
    },
  });
  
  return res.status(201).json(log);
});

// --- Equipment CRUD ---

// GET /api/maintenance/equipment - список оборудования
router.get("/equipment", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (_req, res) => {
  const equipment = await prisma.equipment.findMany({
    orderBy: { nextCheckup: "asc" },
  });
  
  return res.json(equipment);
});

// POST /api/maintenance/equipment - добавить оборудование
router.post("/equipment", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { name, location, lastCheckup, nextCheckup } = req.body;
  
  const equipment = await prisma.equipment.create({
    data: {
      name,
      location: location || null,
      lastCheckup: new Date(lastCheckup),
      nextCheckup: new Date(nextCheckup),
    },
  });
  
  return res.status(201).json(equipment);
});

// PUT /api/maintenance/equipment/:id - обновить оборудование
router.put("/equipment/:id", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  const { name, location, lastCheckup, nextCheckup } = req.body;
  
  const equipment = await prisma.equipment.update({
    where: { id: Number(id) },
    data: {
      name,
      location,
      lastCheckup: lastCheckup ? new Date(lastCheckup) : undefined,
      nextCheckup: nextCheckup ? new Date(nextCheckup) : undefined,
    },
  });
  
  return res.json(equipment);
});

// DELETE /api/maintenance/equipment/:id
router.delete("/equipment/:id", checkRole(["DIRECTOR", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  await prisma.equipment.delete({ where: { id: Number(id) } });
  return res.status(204).send();
});

// GET /api/maintenance/equipment/reminders - напоминания о проверках
router.get("/equipment/reminders", checkRole(["DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { days = 30 } = req.query;
  
  const upcomingCheckups = await prisma.equipment.findMany({
    where: {
      nextCheckup: {
        lte: new Date(Date.now() + Number(days) * 24 * 3600 * 1000),
      },
    },
    orderBy: { nextCheckup: "asc" },
  });
  
  return res.json(upcomingCheckups);
});

export default router;
