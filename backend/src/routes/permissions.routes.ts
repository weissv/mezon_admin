import { Router, Request, Response } from "express";
import { PrismaClient, Role } from "@prisma/client";
import { checkRole } from "../middleware/checkRole";

const prisma = new PrismaClient();
const router = Router();

// Роли с полным доступом по умолчанию (показываются с замком)
const FULL_ACCESS_ROLES: Role[] = ["DEVELOPER", "DIRECTOR"];

// Роли, которые НЕ могут редактировать DEVELOPER (только DEVELOPER может всё)
const PROTECTED_FROM_EDITING: Role[] = ["DIRECTOR"];

// Список всех модулей системы
const ALL_MODULES = [
  "dashboard",
  "children",
  "employees",
  "schedule",
  "staffing",
  "users",
  "groups",
  "clubs",
  "attendance",
  "finance",
  "inventory",
  "menu",
  "recipes",
  "procurement",
  "maintenance",
  "security",
  "documents",
  "calendar",
  "feedback",
  "integration",
  "action-log",
  "notifications",
  "ai-assistant",
];

// Получить все права ролей
router.get("/", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"]), async (req: Request, res: Response) => {
  try {
    const currentUserRole = req.user?.role || "";
    const permissions = await prisma.rolePermission.findMany({
      orderBy: { role: "asc" },
    });

    // Все роли системы, включая TEACHER и ZAVHOZ
    const allRoles: Role[] = ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT", "ZAVHOZ"];
    
    const result = allRoles.map(role => {
      const existing = permissions.find(p => p.role === role);
      const isFullAccess = FULL_ACCESS_ROLES.includes(role);
      
      // DEVELOPER может редактировать любую роль
      // Остальные не могут редактировать DEVELOPER и DIRECTOR
      const canBeEdited = currentUserRole === "DEVELOPER" 
        ? true 
        : !FULL_ACCESS_ROLES.includes(role);
      
      return {
        role,
        isFullAccess,
        canBeEdited, // Новое поле для фронтенда
        modules: isFullAccess ? ALL_MODULES : (existing?.modules || []),
        canCreate: isFullAccess ? true : (existing?.canCreate ?? true),
        canEdit: isFullAccess ? true : (existing?.canEdit ?? true),
        canDelete: isFullAccess ? true : (existing?.canDelete ?? true),
        canExport: isFullAccess ? true : (existing?.canExport ?? false),
        customPermissions: existing?.customPermissions || {},
      };
    });

    return res.json(result);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return res.status(500).json({ error: "Failed to fetch permissions" });
  }
});

// Получить права конкретной роли
// Пользователь может получить свои собственные права или права других ролей (если он админ)
router.get("/:role", async (req: Request, res: Response) => {
  try {
    const role = req.params.role as Role;
    const currentUserRole = req.user?.role;
    
    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    
    // Разрешаем пользователю получать СВОИ собственные права
    // Или если пользователь админ - может смотреть любые права
    const adminRoles: Role[] = ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"];
    const canView = currentUserRole === role || adminRoles.includes(currentUserRole as Role);
    
    if (!canView) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const isFullAccess = FULL_ACCESS_ROLES.includes(role);
    
    if (isFullAccess) {
      return res.json({
        role,
        isFullAccess: true,
        modules: ALL_MODULES,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        customPermissions: {},
      });
    }

    const permission = await prisma.rolePermission.findUnique({
      where: { role },
    });

    res.json({
      role,
      isFullAccess: false,
      modules: permission?.modules || [],
      canCreate: permission?.canCreate ?? true,
      canEdit: permission?.canEdit ?? true,
      canDelete: permission?.canDelete ?? true,
      canExport: permission?.canExport ?? false,
      customPermissions: permission?.customPermissions || {},
    });
  } catch (error) {
    console.error("Error fetching permission:", error);
    res.status(500).json({ error: "Failed to fetch permission" });
  }
});

// Обновить права роли
router.put("/:role", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY"]), async (req: Request, res: Response) => {
  try {
    const role = req.params.role as Role;
    const currentUserRole = req.user?.role;
    
    console.log(`[Permissions] Updating role: ${role} by user with role: ${currentUserRole}`);
    
    if (!Object.values(Role).includes(role)) {
      console.error(`[Permissions] Invalid role: ${role}`);
      return res.status(400).json({ error: "Invalid role" });
    }

    // DEVELOPER может редактировать права ЛЮБОЙ роли (включая DIRECTOR и себя)
    // DIRECTOR и DEPUTY не могут редактировать DEVELOPER и DIRECTOR
    if (currentUserRole !== "DEVELOPER") {
      if (role === "DEVELOPER" || role === "DIRECTOR") {
        console.warn(`[Permissions] User ${currentUserRole} attempted to modify ${role} permissions`);
        return res.status(403).json({ error: "Cannot modify permissions for this role" });
      }
    }

    const { modules, canCreate, canEdit, canDelete, canExport, customPermissions } = req.body;
    console.log(`[Permissions] Updating ${role} with modules:`, modules);

    const permission = await prisma.rolePermission.upsert({
      where: { role },
      update: {
        modules: modules || [],
        canCreate: canCreate ?? true,
        canEdit: canEdit ?? true,
        canDelete: canDelete ?? true,
        canExport: canExport ?? false,
        customPermissions: customPermissions || {},
      },
      create: {
        role,
        modules: modules || [],
        canCreate: canCreate ?? true,
        canEdit: canEdit ?? true,
        canDelete: canDelete ?? true,
        canExport: canExport ?? false,
        customPermissions: customPermissions || {},
      },
    });

    console.log(`[Permissions] Successfully saved permissions for ${role}:`, {
      modules: permission.modules.length,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
      canExport: permission.canExport,
    });

    res.json({
      role: permission.role,
      isFullAccess: false,
      modules: permission.modules,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
      canExport: permission.canExport,
      customPermissions: permission.customPermissions,
    });
  } catch (error) {
    console.error("Error updating permission:", error);
    res.status(500).json({ error: "Failed to update permission" });
  }
});

// Получить список всех доступных модулей
router.get("/meta/modules", checkRole(["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"]), async (req: Request, res: Response) => {
  const modules = [
    { id: "dashboard", label: "Дашборд" },
    { id: "children", label: "Дети" },
    { id: "employees", label: "Сотрудники" },
    { id: "schedule", label: "Расписание" },
    { id: "staffing", label: "Штатное расписание" },
    { id: "users", label: "Пользователи" },
    { id: "groups", label: "Классы" },
    { id: "clubs", label: "Кружки" },
    { id: "attendance", label: "Посещаемость" },
    { id: "finance", label: "Финансы" },
    { id: "inventory", label: "Склад" },
    { id: "menu", label: "Меню" },
    { id: "recipes", label: "Рецепты" },
    { id: "procurement", label: "Закупки" },
    { id: "maintenance", label: "Заявки" },
    { id: "security", label: "Безопасность" },
    { id: "documents", label: "Документы" },
    { id: "calendar", label: "Календарь" },
    { id: "feedback", label: "Обратная связь" },
    { id: "integration", label: "Импорт/Экспорт" },
    { id: "action-log", label: "Журнал действий" },
    { id: "notifications", label: "Уведомления" },
    { id: "ai-assistant", label: "ИИ-Методист" },
  ];
  
  res.json(modules);
});

export default router;
