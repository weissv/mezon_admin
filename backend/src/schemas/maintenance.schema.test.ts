import { describe, expect, it } from 'vitest';
import { createMaintenanceSchema, updateMaintenanceSchema } from './maintenance.schema';

describe('maintenance.schema tests', () => {
  describe('createMaintenanceSchema', () => {
    it('валидирует корректную заявку на выдачу (ISSUE) с позициями', async () => {
      const input = {
        body: {
          title: 'Канцтовары для 1А класса',
          type: 'ISSUE',
          items: [
            {
              name: 'Тетради 12 листов',
              quantity: 20,
              unit: 'шт',
              category: 'STATIONERY' as const,
              inventoryItemId: 1,
            },
          ],
        },
      };

      const result = await createMaintenanceSchema.parseAsync(input);
      expect(result.body.title).toBe('Канцтовары для 1А класса');
      expect(result.body.type).toBe('ISSUE');
      expect(result.body.items?.length).toBe(1);
    });

    it('отклоняет заявку на выдачу (ISSUE) без позиций', async () => {
      const input = {
        body: {
          title: 'Канцтовары для 1А класса',
          type: 'ISSUE',
          items: [],
        },
      };

      await expect(createMaintenanceSchema.parseAsync(input)).rejects.toThrow();
    });

    it('валидирует корректную заявку на покупку (PURCHASE) с позициями', async () => {
      const input = {
        body: {
          title: 'Закупка маркеров для белой доски',
          description: 'Закончились маркеры во всех кабинетах',
          type: 'PURCHASE',
          items: [
            {
              name: 'Маркеры для доски (набор 4 цвета)',
              quantity: 15,
              unit: 'упак',
              category: 'STATIONERY' as const,
              inventoryItemId: null,
            },
          ],
        },
      };

      const result = await createMaintenanceSchema.parseAsync(input);
      expect(result.body.title).toBe('Закупка маркеров для белой доски');
      expect(result.body.type).toBe('PURCHASE');
      expect(result.body.items?.[0].name).toBe('Маркеры для доски (набор 4 цвета)');
      expect(result.body.items?.[0].unit).toBe('упак');
    });

    it('отклоняет заявку на покупку (PURCHASE) без позиций', async () => {
      const input = {
        body: {
          title: 'Закупка бумаги',
          type: 'PURCHASE',
          items: [],
        },
      };

      await expect(createMaintenanceSchema.parseAsync(input)).rejects.toThrow();
    });

    it('валидирует заявку на ремонт (REPAIR) без массива позиций', async () => {
      const input = {
        body: {
          title: 'Ремонт дверного замка в каб. 302',
          description: 'Заедает ключ',
          type: 'REPAIR',
        },
      };

      const result = await createMaintenanceSchema.parseAsync(input);
      expect(result.body.type).toBe('REPAIR');
      expect(result.body.title).toBe('Ремонт дверного замка в каб. 302');
    });

    it('отклоняет слишком короткое наименование', async () => {
      const input = {
        body: {
          title: 'Ab',
          type: 'REPAIR',
        },
      };

      await expect(createMaintenanceSchema.parseAsync(input)).rejects.toThrow();
    });
  });

  describe('updateMaintenanceSchema', () => {
    it('валидирует обновление позиций и статуса для заявки', async () => {
      const input = {
        params: { id: '123' },
        body: {
          title: 'Скорректированная заявка на выдачу',
          status: 'IN_PROGRESS' as const,
          type: 'ISSUE' as const,
          items: [
            {
              name: 'Ручки синие гелевые',
              quantity: 50,
              unit: 'шт',
              category: 'STATIONERY' as const,
              inventoryItemId: 5,
            },
          ],
        },
      };

      const result = await updateMaintenanceSchema.parseAsync(input);
      expect(result.params.id).toBe('123');
      expect(result.body.status).toBe('IN_PROGRESS');
      expect(result.body.items?.length).toBe(1);
    });

    it('валидирует обновление заявки типа PURCHASE', async () => {
      const input = {
        params: { id: '456' },
        body: {
          type: 'PURCHASE' as const,
          status: 'DONE' as const,
        },
      };

      const result = await updateMaintenanceSchema.parseAsync(input);
      expect(result.body.type).toBe('PURCHASE');
      expect(result.body.status).toBe('DONE');
    });
  });
});
