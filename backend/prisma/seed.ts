// backend/prisma/seed.ts
import { PrismaClient, Role, FinanceType, FinanceCategory, TransactionChannel, InventoryType, MaintenanceStatus, MaintenanceType, AgeGroup, ChildStatus, ContractStatus, InvoiceStatus, ItemCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Начинаем заполнение базы данных Mezon Admin (Full Seed)...");

  // Хэши паролей
  const standardPassword = await bcrypt.hash("admin123", 10);
  const developerPassword = await bcrypt.hash("8p09VhXW", 10);

  // ============================================================================
  // 1. РОЛЕВАЯ МОДЕЛЬ И ПРАВА ДОСТУПА (RolePermissions)
  // ============================================================================
  console.log("--> 1. Настройка прав ролей (RolePermissions)...");
  
  const rolePermissionsData = [
    {
      role: Role.DEVELOPER,
      modules: ["dashboard", "children", "groups", "employees", "finance", "inventory", "menu", "recipes", "maintenance", "procurement", "documents", "calendar", "security", "actionlog", "lms", "exams", "knowledge-base", "permissions"],
      canCreate: true, canEdit: true, canDelete: true, canExport: true
    },
    {
      role: Role.DIRECTOR,
      modules: ["dashboard", "children", "groups", "employees", "finance", "inventory", "menu", "recipes", "maintenance", "procurement", "documents", "calendar", "security", "actionlog", "lms", "exams", "knowledge-base"],
      canCreate: true, canEdit: true, canDelete: true, canExport: true
    },
    {
      role: Role.DEPUTY,
      modules: ["dashboard", "children", "groups", "employees", "menu", "recipes", "maintenance", "documents", "calendar", "security", "lms", "exams", "knowledge-base"],
      canCreate: true, canEdit: true, canDelete: false, canExport: true
    },
    {
      role: Role.ADMIN,
      modules: ["dashboard", "children", "groups", "employees", "finance", "inventory", "menu", "recipes", "maintenance", "procurement", "documents", "calendar", "security", "actionlog", "lms", "exams", "knowledge-base", "permissions"],
      canCreate: true, canEdit: true, canDelete: true, canExport: true
    },
    {
      role: Role.TEACHER,
      modules: ["dashboard", "children", "groups", "calendar", "lms", "exams", "knowledge-base"],
      canCreate: true, canEdit: true, canDelete: false, canExport: false
    },
    {
      role: Role.ACCOUNTANT,
      modules: ["dashboard", "children", "finance", "inventory", "procurement", "documents"],
      canCreate: true, canEdit: true, canDelete: false, canExport: true
    },
    {
      role: Role.ZAVHOZ,
      modules: ["dashboard", "inventory", "maintenance", "procurement"],
      canCreate: true, canEdit: true, canDelete: false, canExport: false
    },
  ];

  for (const rp of rolePermissionsData) {
    await prisma.rolePermission.upsert({
      where: { role: rp.role },
      update: { modules: rp.modules, canCreate: rp.canCreate, canEdit: rp.canEdit, canDelete: rp.canDelete, canExport: rp.canExport },
      create: rp,
    });
  }

  // ============================================================================
  // 2. СОТРУДНИКИ И ПОЛЬЗОВАТЕЛИ (Test Accounts from README)
  // ============================================================================
  console.log("--> 2. Создание сотрудников и тестовых аккаунтов из README...");

  const accountsData = [
    {
      email: "director@mezon.uz",
      password: standardPassword,
      role: Role.DIRECTOR,
      firstName: "Алишер",
      lastName: "Навои",
      position: "Директор",
    },
    {
      email: "deputy@mezon.uz",
      password: standardPassword,
      role: Role.DEPUTY,
      firstName: "Елена",
      lastName: "Пак",
      middleName: "Владимировна",
      position: "Завуч",
    },
    {
      email: "teacher@mezon.uz",
      password: standardPassword,
      role: Role.TEACHER,
      firstName: "Анастасия",
      lastName: "Мурудова",
      middleName: "Васильевна",
      position: "Учитель начальных классов",
    },
    {
      email: "accountant@mezon.uz",
      password: standardPassword,
      role: Role.ACCOUNTANT,
      firstName: "Мария",
      lastName: "Иванова",
      middleName: "Сергеевна",
      position: "Главный бухгалтер",
    },
    {
      email: "zavhoz@mezon.uz",
      password: standardPassword,
      role: Role.ZAVHOZ,
      firstName: "Пётр",
      lastName: "Петров",
      middleName: "Алексеевич",
      position: "Завхоз",
    },
    {
      email: "admin@mezon.uz",
      password: standardPassword,
      role: Role.ADMIN,
      firstName: "Сергей",
      lastName: "Смирнов",
      position: "Системный администратор",
    },
    {
      email: "developer@mezon.uz",
      password: standardPassword,
      role: Role.DEVELOPER,
      firstName: "Изуми",
      lastName: "Амано",
      position: "Ведущий разработчик",
    },
    {
      email: "izumi",
      password: developerPassword,
      role: Role.DIRECTOR,
      firstName: "Izumi",
      lastName: "Amano",
      position: "Директор школы",
    },
  ];

  const userMap = new Map<string, { user: any; employee: any }>();

  for (const acc of accountsData) {
    let user = await prisma.user.findUnique({ where: { email: acc.email }, include: { employee: true } });
    if (!user) {
      const employee = await prisma.employee.create({
        data: {
          firstName: acc.firstName,
          lastName: acc.lastName,
          middleName: acc.middleName,
          position: acc.position,
          hireDate: new Date("2024-01-10"),
          rate: 1.0,
        },
      });

      user = await prisma.user.create({
        data: {
          email: acc.email,
          passwordHash: acc.password,
          role: acc.role,
          employeeId: employee.id,
        },
        include: { employee: true },
      });
    }
    userMap.set(acc.email, { user, employee: user.employee });
  }

  const teacherEmployee = userMap.get("teacher@mezon.uz")!.employee;
  const deputyEmployee = userMap.get("deputy@mezon.uz")!.employee;
  const zavhozEmployee = userMap.get("zavhoz@mezon.uz")!.employee;
  const directorEmployee = userMap.get("director@mezon.uz")!.employee;

  // ============================================================================
  // 3. ГРУППЫ И КЛАССЫ (Groups)
  // ============================================================================
  console.log("--> 3. Создание классов и групп...");

  const group4B = await prisma.group.upsert({
    where: { name: "4-Б" },
    update: { teacherId: teacherEmployee.id },
    create: {
      name: "4-Б",
      grade: 4,
      academicYear: "2025-2026",
      capacity: 30,
      teacherId: teacherEmployee.id,
    },
  });

  const group1A = await prisma.group.upsert({
    where: { name: "1-А класс" },
    update: { teacherId: deputyEmployee.id },
    create: {
      name: "1-А класс",
      grade: 1,
      academicYear: "2025-2026",
      capacity: 25,
      teacherId: deputyEmployee.id,
    },
  });

  const groupSun = await prisma.group.upsert({
    where: { name: "Группа 'Солнышко'" },
    update: {},
    create: {
      name: "Группа 'Солнышко'",
      grade: 0,
      academicYear: "2025-2026",
      capacity: 20,
    },
  });

  // ============================================================================
  // 4. УЧЕНИКИ И РОДИТЕЛИ (Children & Parents)
  // ============================================================================
  console.log("--> 4. Создание учеников и родителей...");

  const childrenData = [
    {
      firstName: "Артур",
      lastName: "Гурджиев",
      middleName: "Александрович",
      birthDate: new Date("2016-03-15"),
      gender: "MALE",
      status: ChildStatus.ACTIVE,
      groupId: group4B.id,
      parentName: "Гурджиев Александр В.",
      parentRelation: "отец",
      parentPhone: "+998901234567",
    },
    {
      firstName: "Леонид",
      lastName: "Ким",
      middleName: "Вадимович",
      birthDate: new Date("2016-07-20"),
      gender: "MALE",
      status: ChildStatus.ACTIVE,
      groupId: group4B.id,
      parentName: "Ким Вадим О.",
      parentRelation: "отец",
      parentPhone: "+998909876543",
    },
    {
      firstName: "Жасмин",
      lastName: "Мустапаева",
      middleName: "Ерназаровна",
      birthDate: new Date("2015-11-10"),
      gender: "FEMALE",
      status: ChildStatus.ACTIVE,
      groupId: group4B.id,
      parentName: "Мустапаева Гульнара Б.",
      parentRelation: "мать",
      parentPhone: "+998935554433",
    },
    {
      firstName: "Василиса",
      lastName: "Мухамедиева",
      middleName: "Дмитриевна",
      birthDate: new Date("2016-05-12"),
      gender: "FEMALE",
      status: ChildStatus.ACTIVE,
      groupId: group4B.id,
      parentName: "Мухамедиев Дмитрий С.",
      parentRelation: "отец",
      parentPhone: "+998971112233",
    },
    {
      firstName: "Тимур",
      lastName: "Каримов",
      middleName: "Ахматович",
      birthDate: new Date("2017-05-14"),
      gender: "MALE",
      status: ChildStatus.ACTIVE,
      groupId: group1A.id,
      parentName: "Каримов Ахмат Р.",
      parentRelation: "отец",
      parentPhone: "+998901110022",
    },
  ];

  const createdChildren = [];

  for (const c of childrenData) {
    let child = await prisma.child.findFirst({
      where: { firstName: c.firstName, lastName: c.lastName, groupId: c.groupId },
    });

    if (!child) {
      child = await prisma.child.create({
        data: {
          firstName: c.firstName,
          lastName: c.lastName,
          middleName: c.middleName,
          birthDate: c.birthDate,
          gender: c.gender as any,
          status: c.status,
          groupId: c.groupId,
        },
      });

      await prisma.parent.create({
        data: {
          childId: child.id,
          fullName: c.parentName,
          relation: c.parentRelation,
          phone: c.parentPhone,
        },
      });
    }
    createdChildren.push(child);
  }

  // ============================================================================
  // 5. ДОГОВОРЫ УЧЕНИКОВ И СЧЕТА (StudentContracts, Invoices, Debt Indicators)
  // ============================================================================
  console.log("--> 5. Создание договоров, счетов и финансовых транзакций...");

  const currentPeriod = "2026-07";
  const issueDate = new Date("2026-07-01");
  const pastDueDate = new Date("2026-07-10");
  const futureDueDate = new Date("2026-08-10");

  // Child 1 (Гурджиев): PAID -> balance 0, hasDebt false
  const child1 = createdChildren[0];
  const contract1 = await prisma.studentContract.upsert({
    where: { contractNumber: `DOG-2025-${child1.id}` },
    update: {},
    create: {
      childId: child1.id,
      contractNumber: `DOG-2025-${child1.id}`,
      startDate: new Date("2025-09-01"),
      monthlyFee: 3500000,
      status: ContractStatus.ACTIVE,
    },
  });

  const inv1 = await prisma.invoice.upsert({
    where: { number: `INV-202607-${child1.id}` },
    update: { status: InvoiceStatus.PAID },
    create: {
      childId: child1.id,
      contractId: contract1.id,
      number: `INV-202607-${child1.id}`,
      amount: 3500000,
      issueDate,
      dueDate: pastDueDate,
      status: InvoiceStatus.PAID,
      period: currentPeriod,
      description: `Оплата за обучение (${currentPeriod}) по договору №${contract1.contractNumber}`,
    },
  });

  await prisma.financeTransaction.create({
    data: {
      amount: 3500000,
      type: FinanceType.INCOME,
      category: FinanceCategory.OTHER,
      channel: TransactionChannel.BANK,
      description: `Оплата по счету №${inv1.number} (${child1.lastName} ${child1.firstName})`,
      date: issueDate,
      posted: true,
      childId: child1.id,
    },
  });

  // Child 2 (Ким): OVERDUE -> balance -3,500,000, hasDebt true (Красный индикатор задолженности)
  const child2 = createdChildren[1];
  const contract2 = await prisma.studentContract.upsert({
    where: { contractNumber: `DOG-2025-${child2.id}` },
    update: {},
    create: {
      childId: child2.id,
      contractNumber: `DOG-2025-${child2.id}`,
      startDate: new Date("2025-09-01"),
      monthlyFee: 3500000,
      status: ContractStatus.ACTIVE,
    },
  });

  await prisma.invoice.upsert({
    where: { number: `INV-202607-${child2.id}` },
    update: { status: InvoiceStatus.OVERDUE },
    create: {
      childId: child2.id,
      contractId: contract2.id,
      number: `INV-202607-${child2.id}`,
      amount: 3500000,
      issueDate,
      dueDate: pastDueDate,
      status: InvoiceStatus.OVERDUE,
      period: currentPeriod,
      description: `Оплата за обучение (${currentPeriod}) по договору №${contract2.contractNumber}`,
    },
  });

  // Child 3 (Мустапаева): PENDING -> balance -3,500,000
  const child3 = createdChildren[2];
  const contract3 = await prisma.studentContract.upsert({
    where: { contractNumber: `DOG-2025-${child3.id}` },
    update: {},
    create: {
      childId: child3.id,
      contractNumber: `DOG-2025-${child3.id}`,
      startDate: new Date("2025-09-01"),
      monthlyFee: 3500000,
      status: ContractStatus.ACTIVE,
    },
  });

  await prisma.invoice.upsert({
    where: { number: `INV-202607-${child3.id}` },
    update: { status: InvoiceStatus.PENDING },
    create: {
      childId: child3.id,
      contractId: contract3.id,
      number: `INV-202607-${child3.id}`,
      amount: 3500000,
      issueDate,
      dueDate: futureDueDate,
      status: InvoiceStatus.PENDING,
      period: currentPeriod,
      description: `Оплата за обучение (${currentPeriod}) по договору №${contract3.contractNumber}`,
    },
  });

  // Общие расходы/доходы
  await prisma.financeTransaction.create({
    data: {
      amount: 1200000,
      type: FinanceType.EXPENSE,
      category: FinanceCategory.MAINTENANCE,
      channel: TransactionChannel.CASH,
      description: "Закупка хозтоваров для уборки классов",
      date: new Date("2026-07-05"),
      posted: true,
    },
  });

  // ============================================================================
  // 6. СКЛАД И ТМЦ (InventoryItems & Suppliers)
  // ============================================================================
  console.log("--> 6. Создание склада и ТМЦ...");

  let supplier = await prisma.supplier.findFirst({ where: { name: "ООО Мезон Поставка" } });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        name: "ООО Мезон Поставка",
        phone: "+998712000000",
        address: "г. Ташкент, ул. Навои, 15",
      },
    });
  }

  let flourItem = await prisma.inventoryItem.findFirst({ where: { name: "Мука пшеничная высший сорт" } });
  if (!flourItem) {
    flourItem = await prisma.inventoryItem.create({
      data: {
        name: "Мука пшеничная высший сорт",
        type: InventoryType.FOOD,
        quantity: 150.0,
        unit: "кг",
        minQuantity: 20.0,
        price: 8500,
        calories: 334, protein: 10.3, fat: 1.1, carbs: 68.9,
      },
    });
  }

  let soapItem = await prisma.inventoryItem.findFirst({ where: { name: "Мыло жидкое гигиеническое" } });
  if (!soapItem) {
    soapItem = await prisma.inventoryItem.create({
      data: {
        name: "Мыло жидкое гигиеническое",
        type: InventoryType.HOUSEHOLD,
        quantity: 45.0,
        unit: "л",
        minQuantity: 10.0,
        price: 18000,
      },
    });
  }

  let paperItem = await prisma.inventoryItem.findFirst({ where: { name: "Бумага А4 Снегурочка" } });
  if (!paperItem) {
    paperItem = await prisma.inventoryItem.create({
      data: {
        name: "Бумага А4 Снегурочка",
        type: InventoryType.STATIONERY,
        quantity: 80.0,
        unit: "пачка",
        minQuantity: 15.0,
        price: 48000,
      },
    });
  }

  // ============================================================================
  // 7. КУХНЯ И МЕНЮ (Dishes & Menu)
  // ============================================================================
  console.log("--> 7. Создание технологических карт и меню...");

  let porridge = await prisma.dish.findFirst({ where: { name: "Овсяная каша молочная" } });
  if (!porridge) {
    porridge = await prisma.dish.create({
      data: {
        name: "Овсяная каша молочная",
        category: "Завтрак",
        preparationTime: 20,
      },
    });
  }

  let soup = await prisma.dish.findFirst({ where: { name: "Суп куриный с лапшой" } });
  if (!soup) {
    soup = await prisma.dish.create({
      data: {
        name: "Суп куриный с лапшой",
        category: "Обед",
        preparationTime: 40,
      },
    });
  }

  // ============================================================================
  // 8. ЗАЯВКИ ЗАВХОЗУ (MaintenanceRequests)
  // ============================================================================
  console.log("--> 8. Создание заявок завхозу...");

  const req1 = await prisma.maintenanceRequest.create({
    data: {
      title: "Замена замка в кабинете 204",
      description: "Заедает ключ при открытии двери",
      type: MaintenanceType.REPAIR,
      status: MaintenanceStatus.APPROVED,
      requesterId: teacherEmployee.id,
      approvedById: directorEmployee.id,
      approvedAt: new Date("2026-07-20"),
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      title: "Выдача бумаги А4 (5 пачек)",
      type: MaintenanceType.ISSUE,
      status: MaintenanceStatus.DONE,
      requesterId: deputyEmployee.id,
      approvedById: directorEmployee.id,
      approvedAt: new Date("2026-07-21"),
      items: {
        create: [
          {
            name: "Бумага А4 Снегурочка",
            quantity: 5,
            issuedQuantity: 5,
            unit: "пачка",
            category: ItemCategory.STATIONERY,
            inventoryItemId: paperItem.id,
          },
        ],
      },
    },
  });

  // ============================================================================
  // 9. КРУЖКИ И СЕКЦИИ (Clubs)
  // ============================================================================
  console.log("--> 9. Создание кружков и секций...");

  let chessClub = await prisma.club.findFirst({
    where: { name: "Шахматный клуб 'Ладья'", teacherId: teacherEmployee.id },
  });
  if (!chessClub) {
    chessClub = await prisma.club.create({
      data: {
        name: "Шахматный клуб 'Ладья'",
        description: "Обучение логике и стратегии для детей 7-12 лет",
        schedule: [{ day: "Понедельник", time: "15:00" }, { day: "Среда", time: "15:00" }],
        cost: 400000,
        maxStudents: 15,
        teacherId: teacherEmployee.id,
      },
    });
  }

  // ============================================================================
  // 10. LMS СИСТЕМА И РАСПИСАНИЕ (LMS & Schedule)
  // ============================================================================
  console.log("--> 10. Создание предметов и расписания LMS...");

  let mathSubject = await prisma.lmsSubject.findFirst({ where: { name: "Математика" } });
  if (!mathSubject) {
    mathSubject = await prisma.lmsSubject.create({
      data: {
        name: "Математика",
        description: "Математика и логика для младших классов",
        hoursPerWeek: 4,
      },
    });
  }

  let russianSubject = await prisma.lmsSubject.findFirst({ where: { name: "Родной язык" } });
  if (!russianSubject) {
    russianSubject = await prisma.lmsSubject.create({
      data: {
        name: "Родной язык",
        description: "Грамматика и развитие речи",
        hoursPerWeek: 3,
      },
    });
  }

  const existingSchedule = await prisma.lmsScheduleItem.findFirst({
    where: { classId: group4B.id, subjectId: mathSubject.id },
  });
  if (!existingSchedule) {
    await prisma.lmsScheduleItem.create({
      data: {
        classId: group4B.id,
        subjectId: mathSubject.id,
        teacherId: teacherEmployee.id,
        dayOfWeek: 1,
        startTime: "08:30",
        endTime: "09:15",
        room: "Кабинет 204",
      },
    });
  }

  // ============================================================================
  // 11. ПЛАТФОРМА КОНТРОЛЬНЫХ РАБОТ (Exams)
  // ============================================================================
  console.log("--> 11. Создание контрольной работы...");

  let exam = await prisma.exam.findFirst({ where: { publicToken: "exam-math-4b-2026" } });
  if (!exam) {
    await prisma.exam.create({
      data: {
        title: "Итоговая контрольная работа по математике (4 класс)",
        description: "Проверка знаний за 3 четверть по теме 'Умножение и деление многозначных чисел'",
        subject: "Математика",
        creatorId: teacherEmployee.id,
        publicToken: "exam-math-4b-2026",
        timeLimit: 45,
        passingScore: 60,
        status: "PUBLISHED",
        questions: {
          create: [
            {
              orderIndex: 1,
              type: "SINGLE_CHOICE",
              content: "Чему равно произведение 12 * 8?",
              options: ["84", "96", "108", "88"],
              correctAnswer: "96",
              points: 5,
            },
            {
              orderIndex: 2,
              type: "TEXT_LONG",
              content: "Решите задачу: В двух корзинах было 48 яблок. Во второй корзине в 3 раза больше яблок, чем в первой. Сколько яблок в первой корзине? Запишите ход решения.",
              expectedAnswer: "В первой корзине 12 яблок. Уравнение: x + 3x = 48 -> 4x = 48 -> x = 12.",
              points: 15,
            },
          ],
        },
      },
    });
  }

  // ============================================================================
  // 12. БАЗА ЗНАНИЙ (KnowledgeBase)
  // ============================================================================
  console.log("--> 12. Создание статей базы знаний...");

  await prisma.knowledgeBaseArticle.upsert({
    where: { slug: "school-schedule-rules" },
    update: {},
    create: {
      title: "Регламент проведения уроков и перемен",
      slug: "school-schedule-rules",
      summary: "Регламент проведения уроков и перемен в школе",
      content: "Длительность урока составляет 45 минут. Перемены составляют не менее 10 минут...",
      tags: ["регламент", "расписание", "правила"],
      roles: [Role.TEACHER, Role.DEPUTY, Role.DIRECTOR],
      authorId: userMap.get("director@mezon.uz")!.user.id,
    },
  });

  console.log("\n🎉 Полное сидирование базы данных Mezon Admin завершено успешно!");
}

main()
  .catch((e) => {
    console.error("❌ Ошибка при сидировании:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
