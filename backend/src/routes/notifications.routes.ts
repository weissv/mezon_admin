// src/routes/notifications.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// GET /api/notifications
router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (_req, res) => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringContracts = await prisma.employee.findMany({
    where: {
      contractEndDate: {
        lte: thirtyDaysFromNow,
        gte: new Date(), // Только будущие или текущие даты
      },
      fireDate: null,
    },
  });

  const expiringMedicalCheckups = await prisma.employee.findMany({
    where: {
      medicalCheckupDate: {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      },
      fireDate: null,
    },
  });

  const notifications = [
    ...expiringContracts.map(emp => ({
      type: 'CONTRACT_EXPIRING',
      message: `У сотрудника ${emp.lastName} ${emp.firstName} истекает контракт ${emp.contractEndDate?.toLocaleDateString()}.`,
      employeeId: emp.id,
      date: emp.contractEndDate,
    })),
    ...expiringMedicalCheckups.map(emp => ({
      type: 'MEDICAL_CHECKUP_DUE',
      message: `У сотрудника ${emp.lastName} ${emp.firstName} истекает срок медосмотра ${emp.medicalCheckupDate?.toLocaleDateString()}.`,
      employeeId: emp.id,
      date: emp.medicalCheckupDate,
    })),
  ];

  // Сортируем по дате
  notifications.sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

  return res.json(notifications);
});

export default router;
