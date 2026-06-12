import { PrismaClient, InventoryType } from '@prisma/client';

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Возвращает статистику расходов за период по типам (продукты, хозтовары, канцтовары)
   * Расчет ведется по факту выдачи (расхода) со склада: InventoryTransactionType === 'OUT'
   */
  async getExpensesStatistics(startDate: Date, endDate: Date) {
    // Получаем транзакции расхода
    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: {
        type: 'OUT',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        inventoryItem: true,
      },
    });

    let foodExpenses = 0;
    let householdExpenses = 0;
    let stationeryExpenses = 0;
    
    // Агрегируем количественный расход по конкретным товарам
    const itemsMap: Record<number, { id: number; name: string; type: string; unit: string; quantity: number; cost: number }> = {};

    for (const tx of transactions) {
      const cost = tx.quantity * Number(tx.inventoryItem.price || 0);

      if (tx.inventoryItem.type === 'FOOD') {
        foodExpenses += cost;
      } else if (tx.inventoryItem.type === 'HOUSEHOLD') {
        householdExpenses += cost;
      } else if (tx.inventoryItem.type === 'STATIONERY') {
        stationeryExpenses += cost;
      }

      if (!itemsMap[tx.inventoryItemId]) {
        itemsMap[tx.inventoryItemId] = {
          id: tx.inventoryItemId,
          name: tx.inventoryItem.name,
          type: tx.inventoryItem.type,
          unit: tx.inventoryItem.unit,
          quantity: 0,
          cost: 0,
        };
      }
      
      itemsMap[tx.inventoryItemId].quantity += tx.quantity;
      itemsMap[tx.inventoryItemId].cost += cost;
    }

    const totalExpenses = foodExpenses + householdExpenses + stationeryExpenses;

    // Считаем активных учеников за этот период (в текущей логике просто ACTIVE, 
    // но правильнее считать тех, кто был активен на endDate или имел статус ACTIVE)
    const activeChildrenCount = await this.prisma.child.count({
      where: {
        status: 'ACTIVE',
      },
    });

    const expensesPerChild = activeChildrenCount > 0 ? totalExpenses / activeChildrenCount : 0;

    return {
      period: { startDate, endDate },
      expenses: {
        food: foodExpenses,
        household: householdExpenses,
        stationery: stationeryExpenses,
        total: totalExpenses,
      },
      itemsUsage: Object.values(itemsMap).map(item => ({
        ...item,
        quantityPerChild: activeChildrenCount > 0 ? item.quantity / activeChildrenCount : 0,
      })).sort((a, b) => b.cost - a.cost), // Сортируем по убыванию стоимости
      students: {
        activeCount: activeChildrenCount,
        expensesPerChild,
      },
    };
  }

  /**
   * Возвращает статистику выдачи ТМЦ по сотрудникам (через заявки завхозу)
   */
  async getEmployeeUsageStatistics(startDate: Date, endDate: Date, type?: string) {
    const whereClause: any = {
      request: {
        status: { in: ['COMPLETED', 'DONE'] },
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (type && type !== 'ALL') {
      whereClause.inventoryItem = { type: type as InventoryType };
    }

    const items = await this.prisma.maintenanceItem.findMany({
      where: whereClause,
      include: {
        request: {
          include: {
            requester: true,
          },
        },
        inventoryItem: true,
      },
    });

    // Агрегируем по сотруднику
    const usageByEmployee: Record<string, { employeeName: string; employeePosition: string; items: Record<string, { itemName: string, unit: string, quantity: number }> }> = {};

    for (const item of items) {
      if (!item.request?.requester) continue;
      
      // Надежный fallback: если завхоз не указал issuedQuantity, берем изначальный quantity запроса
      const actualQuantity = item.issuedQuantity || item.quantity;
      if (!actualQuantity) continue; 

      const empId = item.request.requester.id.toString();
      if (!usageByEmployee[empId]) {
        usageByEmployee[empId] = {
          employeeName: `${item.request.requester.firstName} ${item.request.requester.lastName}`,
          employeePosition: item.request.requester.position,
          items: {},
        };
      }

      const itemName = item.name || item.inventoryItem?.name || 'Неизвестный товар';
      if (!usageByEmployee[empId].items[itemName]) {
        usageByEmployee[empId].items[itemName] = {
          itemName,
          unit: item.unit,
          quantity: 0,
        };
      }

      usageByEmployee[empId].items[itemName].quantity += actualQuantity;
    }

    // Форматируем для ответа массива
    return Object.keys(usageByEmployee).map(empId => ({
      employeeId: Number(empId),
      employeeName: usageByEmployee[empId].employeeName,
      employeePosition: usageByEmployee[empId].employeePosition,
      usage: Object.values(usageByEmployee[empId].items),
    })).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }
}

export default new AnalyticsService();
