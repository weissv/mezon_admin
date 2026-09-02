import { describe, expect, it } from 'vitest';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  maintenanceTypeLabels,
  maintenanceTypeColors,
  isPartiallyFulfilled,
  MaintenanceRequest,
} from './maintenance';

describe('Frontend maintenance types and validation', () => {
  it('содержит корректные метки и цвета для всех типов включая PURCHASE', () => {
    expect(maintenanceTypeLabels.ISSUE).toBe('Выдача');
    expect(maintenanceTypeLabels.PURCHASE).toBe('Покупка');
    expect(maintenanceTypeLabels.REPAIR).toBe('Ремонт');

    expect(maintenanceTypeColors.PURCHASE).toContain('emerald');
    expect(maintenanceTypeColors.ISSUE).toContain('purple');
    expect(maintenanceTypeColors.REPAIR).toContain('orange');
  });

  it('валидирует создание заявки на покупку (PURCHASE)', () => {
    const validPurchase = {
      title: 'Закупка бумаги А4',
      type: 'PURCHASE' as const,
      items: [
        {
          name: 'Бумага SvetoCopy A4',
          quantity: 10,
          unit: 'пач',
          category: 'STATIONERY' as const,
        },
      ],
    };

    const parsed = createMaintenanceSchema.safeParse(validPurchase);
    expect(parsed.success).toBe(true);
  });

  it('отклоняет создание заявки на покупку (PURCHASE) без позиций', () => {
    const invalidPurchase = {
      title: 'Закупка канцелярии',
      type: 'PURCHASE' as const,
      items: [],
    };

    const parsed = createMaintenanceSchema.safeParse(invalidPurchase);
    expect(parsed.success).toBe(false);
  });

  it('валидирует создание заявки на выдачу (ISSUE)', () => {
    const validIssue = {
      title: 'Выдача тетрадей',
      type: 'ISSUE' as const,
      items: [
        {
          name: 'Тетради в клетку 12л',
          quantity: 30,
          unit: 'шт',
          category: 'STATIONERY' as const,
          inventoryItemId: 3,
        },
      ],
    };

    const parsed = createMaintenanceSchema.safeParse(validIssue);
    expect(parsed.success).toBe(true);
  });

  it('валидирует создание заявки на ремонт (REPAIR) без массива позиций', () => {
    const validRepair = {
      title: 'Замена лампы в каб. 101',
      description: 'Перегорела светодиодная лампа',
      type: 'REPAIR' as const,
    };

    const parsed = createMaintenanceSchema.safeParse(validRepair);
    expect(parsed.success).toBe(true);
  });

  it('корректно определяет частичную выдачу', () => {
    const partialReq: MaintenanceRequest = {
      id: 1,
      title: 'Выдача канцтоваров',
      type: 'ISSUE',
      status: 'DONE',
      requesterId: 10,
      createdAt: '2026-09-03',
      updatedAt: '2026-09-03',
      items: [
        {
          id: 101,
          requestId: 1,
          name: 'Ручки',
          quantity: 10,
          issuedQuantity: 5, // выдано меньше запрошенного
          unit: 'шт',
          category: 'STATIONERY',
          createdAt: '2026-09-03',
        },
      ],
    };

    expect(isPartiallyFulfilled(partialReq)).toBe(true);

    const fullReq: MaintenanceRequest = {
      ...partialReq,
      items: [
        {
          id: 101,
          requestId: 1,
          name: 'Ручки',
          quantity: 10,
          issuedQuantity: 10, // выдано полностью
          unit: 'шт',
          category: 'STATIONERY',
          createdAt: '2026-09-03',
        },
      ],
    };

    expect(isPartiallyFulfilled(fullReq)).toBe(false);
  });
});
