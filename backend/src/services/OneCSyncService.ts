import { FinanceType, FinanceCategory, FinanceSource } from "@prisma/client";
import { prisma } from "../prisma";

interface SyncResult {
  status: "success";
  syncedCount: number;
  timestamp: Date;
}

const MOCK_DESCRIPTIONS: Record<FinanceType, string[]> = {
  INCOME: [
    "Синхронизация 1С: Поступление средств",
    "1С: Зачисление бюджетного финансирования",
    "1С: Поступление родительской оплаты",
    "1С: Грант на развитие инфраструктуры",
    "1С: Поступление спонсорских средств",
    "1С: Возврат переплаты от поставщика",
  ],
  EXPENSE: [
    "Оплата поставщику (1С)",
    "1С: Начисление заработной платы",
    "1С: Оплата коммунальных услуг",
    "1С: Закупка учебных материалов",
    "1С: Оплата ремонтных работ",
    "1С: Перечисление налогов и сборов",
  ],
};

const CATEGORIES: FinanceCategory[] = ["NUTRITION", "CLUBS", "MAINTENANCE", "SALARY"];
const SOURCES: FinanceSource[] = ["BUDGET", "EXTRA_BUDGET"];
const TYPES: FinanceType[] = ["INCOME", "EXPENSE"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateWithinLastDays(days: number): Date {
  const now = Date.now();
  const offset = Math.random() * days * 24 * 60 * 60 * 1000;
  return new Date(now - offset);
}

function randomAmount(): number {
  // Generate a realistic amount between 50,000 and 5,000,000 rounded to hundreds
  return Math.round(randomInt(50000, 5000000) / 100) * 100;
}

class OneCSyncServiceClass {
  async mockSync(): Promise<SyncResult> {
    // Simulate network delay (1.5 – 2.5s)
    const delay = 1500 + Math.random() * 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const count = randomInt(3, 12);

    const transactions = Array.from({ length: count }, () => {
      const type = randomElement(TYPES);
      return {
        type,
        category: randomElement(CATEGORIES),
        source: randomElement(SOURCES),
        amount: randomAmount(),
        date: randomDateWithinLastDays(3),
        description: randomElement(MOCK_DESCRIPTIONS[type]),
      };
    });

    await prisma.financeTransaction.createMany({ data: transactions });

    return {
      status: "success",
      syncedCount: count,
      timestamp: new Date(),
    };
  }
}

export const OneCSyncService = new OneCSyncServiceClass();
