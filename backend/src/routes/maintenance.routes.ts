// src/routes/maintenance.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
const router = Router();
import { validate } from "../middleware/validate";
import { createMaintenanceSchema, updateMaintenanceSchema } from "../schemas/maintenance.schema";
import { notifyRole, sendTelegramMessage } from "../services/TelegramService";

// GET /api/maintenance - получить заявки с учетом роли
router.get("/", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ZAVHOZ"]), async (req, res) => {
  const user = req.user!;
  const userRole = user.role;
  
  let whereClause: any = {};
  
  // DEVELOPER видит всё
  if (userRole === "DEVELOPER") {
    whereClause = {};
  }
  // ZAVHOZ видит только ОДОБРЕННЫЕ заявки
  else if (userRole === "ZAVHOZ") {
    whereClause = {
      status: { in: ["APPROVED", "IN_PROGRESS", "DONE"] }
    };
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
      items: true // Включаем позиции заявки
    },
    orderBy: { createdAt: "desc" },
  });
  
  res.json(items);
});

router.post("/", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ZAVHOZ"]), validate(createMaintenanceSchema), async (req, res) => {
  const { items, ...data } = req.body;
  const user = req.user!;
  
  const created = await prisma.maintenanceRequest.create({
    data: { 
      ...data, 
      requesterId: user.employeeId,
      status: "PENDING", // Все новые заявки начинаются с PENDING
      // Nested write для создания позиций
      items: items && items.length > 0 ? {
        create: items.map((item: { name: string; quantity: number; unit: string; category: string }) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        }))
      } : undefined
    },
    include: {
      requester: true,
      items: true
    }
  });

  // 📱 Telegram уведомление о новой заявке
  try {
    const requesterName = `${created.requester.firstName} ${created.requester.lastName}`;
    const requestTitle = created.title || `Заявка #${created.id}`;
    
    if (user.role === 'TEACHER') {
      // Учитель -> уведомляем Завуча (DEPUTY)
      await notifyRole('DEPUTY', 
        `📋 <b>Новая заявка от учителя</b>\n\n` +
        `👤 От: ${requesterName}\n` +
        `📝 Тема: ${requestTitle}\n` +
        `🔢 ID заявки: #${created.id}`
      );
    } else {
      // Не учитель -> уведомляем Директора
      await notifyRole('DIRECTOR', 
        `📋 <b>Новая заявка</b>\n\n` +
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

router.put("/:id", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "ZAVHOZ", "TEACHER"]), validate(updateMaintenanceSchema), async (req, res) => {
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
  
  // Учитель не может редактировать одобренную заявку
  if (user.role === "TEACHER" && request.status === "APPROVED") {
    return res.status(403).json({ message: "Нельзя редактировать одобренную заявку" });
  }
  
  // ZAVHOZ может редактировать APPROVED/IN_PROGRESS заявки (включая изменение статуса)
  if (user.role === "ZAVHOZ" && request.status !== "APPROVED" && request.status !== "IN_PROGRESS" && request.status !== "DONE") {
    return res.status(403).json({ message: "Нет прав для редактирования" });
  }
  
  const { items, ...updateData } = req.body;
  const previousStatus = request.status;
  
  // Если items передан, делаем полную замену позиций
  const updated = await prisma.maintenanceRequest.update({ 
    where: { id }, 
    data: {
      ...updateData,
      // Если items передан, удаляем старые и создаем новые
      items: items ? {
        deleteMany: {}, // Удаляем все старые позиции
        create: items.map((item: { name: string; quantity: number; unit: string; category: string }) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
        }))
      } : undefined
    },
    include: {
      requester: {
        include: {
          user: { select: { id: true } }
        }
      },
      approvedBy: true,
      items: true
    }
  });

  // 📱 Telegram уведомление заявителю при завершении заявки
  if (updated.status === 'DONE' && previousStatus !== 'DONE') {
    try {
      const requesterId = updated.requester.user?.id;
      if (requesterId) {
        const requestTitle = updated.title || `Заявка #${updated.id}`;
        await sendTelegramMessage(requesterId, 
          `✅ <b>Заявка выполнена!</b>\n\n` +
          `🔢 ID заявки: #${updated.id}\n` +
          `📝 Тема: ${requestTitle}\n\n` +
          `Ваша заявка была успешно выполнена.`
        );
      }
    } catch (error) {
      console.error('Ошибка отправки Telegram уведомления:', error);
    }
  }

  res.json(updated);
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
    await notifyRole('ZAVHOZ', 
      `✅ <b>Заявка одобрена</b>\n\n` +
      `🔢 ID заявки: #${updated.id}\n` +
      `📝 Тема: ${requestTitle}\n` +
      `👤 От: ${updated.requester.firstName} ${updated.requester.lastName}\n\n` +
      `⚡ Готова к выполнению`
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
