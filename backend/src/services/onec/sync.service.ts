// src/services/onec/sync.service.ts
// Модульный синхронизатор 1С → Prisma (mapping-based architecture)

import { AxiosInstance } from "axios";
import cron from "node-cron";
import { prisma } from "../../prisma";
import { config } from "../../config";
import { createOneCClient, isNetworkError } from "./onec-client";
import {
  FinanceType,
  FinanceCategory,
  FinanceSource,
  InventoryType,
} from "@prisma/client";

// ───────────────────── Типы ─────────────────────

/** Результат синхронизации одного маппинга */
interface SyncResult {
  entity: string;
  fetched: number;
  created: number;
  updated: number;
  errors: number;
  durationMs: number;
}

/** Полный отчёт о синхронизации */
interface SyncReport {
  startedAt: Date;
  finishedAt: Date;
  results: SyncResult[];
  overallStatus: "success" | "partial" | "failed";
}

/**
 * Описание маппинга: 1С OData endpoint → Prisma upsert.
 * Каждый маппинг описывает:
 *  - odataEntity: имя сущности OData (e.g. "Catalog_Номенклатура")
 *  - transform: как преобразовать запись 1С в данные для Prisma upsert
 *  - upsert: функция выполнения upsert в Prisma
 */
interface EntityMapping<TPrismaCreate> {
  odataEntity: string;
  label: string;
  /** OData $select — перечисление нужных полей (уменьшает трафик) */
  select?: string;
  /** Дополнительные OData параметры (?$filter, ...) */
  extraParams?: Record<string, string>;
  /** Преобразование одной записи 1С → данные для upsert */
  transform: (row: any) => TPrismaCreate | null;
  /** Выполнить upsert одной записи. externalId — Ref_Key из 1С */
  upsert: (externalId: string, data: TPrismaCreate) => Promise<void>;
}

// ───────────────────── Маппинги ─────────────────────

/**
 * Catalog_Номенклатура → InventoryItem
 */
const inventoryMapping: EntityMapping<{
  name: string;
  unit: string;
  type: InventoryType;
}> = {
  odataEntity: "Catalog_Номенклатура",
  label: "Номенклатура → InventoryItem",
  select: "Ref_Key,Description,БазоваяЕдиницаИзмерения",
  transform(row) {
    const refKey = row.Ref_Key;
    if (!refKey || row.DeletionMark === true) return null;

    return {
      name: row.Description?.trim() || "Без названия",
      unit: row.БазоваяЕдиницаИзмерения?.trim() || "шт",
      type: "HOUSEHOLD" as InventoryType, // По умолчанию; можно уточнить правила
    };
  },
  async upsert(externalId, data) {
    await prisma.inventoryItem.upsert({
      where: { externalId },
      update: { name: data.name, unit: data.unit },
      create: {
        externalId,
        name: data.name,
        quantity: 0,
        unit: data.unit,
        type: data.type,
      },
    });
  },
};

/**
 * Catalog_Контрагенты → Supplier
 */
const supplierMapping: EntityMapping<{
  name: string;
  inn: string | null;
  phone: string | null;
  address: string | null;
}> = {
  odataEntity: "Catalog_Контрагенты",
  label: "Контрагенты → Supplier",
  select: "Ref_Key,Description,ИНН,Телефон,ЮридическийАдрес",
  transform(row) {
    const refKey = row.Ref_Key;
    if (!refKey || row.DeletionMark === true) return null;

    return {
      name: row.Description?.trim() || "Без названия",
      inn: row.ИНН?.trim() || null,
      phone: row.Телефон?.trim() || null,
      address: row.ЮридическийАдрес?.trim() || null,
    };
  },
  async upsert(externalId, data) {
    await prisma.supplier.upsert({
      where: { externalId },
      update: {
        name: data.name,
        inn: data.inn,
        phone: data.phone,
        address: data.address,
      },
      create: {
        externalId,
        name: data.name,
        inn: data.inn,
        phone: data.phone,
        address: data.address,
      },
    });
  },
};

/**
 * Document_ПриходныйКассовыйОрдер → FinanceTransaction (INCOME)
 */
const cashIncomeMapping: EntityMapping<{
  amount: number;
  date: Date;
  description: string;
}> = {
  odataEntity: "Document_ПриходныйКассовыйОрдер",
  label: "ПКО → FinanceTransaction (INCOME)",
  select: "Ref_Key,Date,СуммаДокумента,Комментарий,Number",
  transform(row) {
    const refKey = row.Ref_Key;
    if (!refKey || row.DeletionMark === true) return null;

    const amount = parseFloat(row.СуммаДокумента);
    if (isNaN(amount) || amount <= 0) return null;

    return {
      amount,
      date: new Date(row.Date),
      description: `1С ПКО №${row.Number || "?"}: ${row.Комментарий || ""}`.trim(),
    };
  },
  async upsert(externalId, data) {
    await prisma.financeTransaction.upsert({
      where: { externalId },
      update: {
        amount: data.amount,
        date: data.date,
        description: data.description,
      },
      create: {
        externalId,
        amount: data.amount,
        type: "INCOME" as FinanceType,
        category: "MAINTENANCE" as FinanceCategory,
        source: "BUDGET" as FinanceSource,
        date: data.date,
        description: data.description,
      },
    });
  },
};

/**
 * Document_СписаниеСРасчетногоСчета → FinanceTransaction (EXPENSE)
 */
const bankExpenseMapping: EntityMapping<{
  amount: number;
  date: Date;
  description: string;
}> = {
  odataEntity: "Document_СписаниеСРасчетногоСчета",
  label: "Списание РС → FinanceTransaction (EXPENSE)",
  select: "Ref_Key,Date,СуммаДокумента,НазначениеПлатежа,Number",
  transform(row) {
    const refKey = row.Ref_Key;
    if (!refKey || row.DeletionMark === true) return null;

    const amount = parseFloat(row.СуммаДокумента);
    if (isNaN(amount) || amount <= 0) return null;

    return {
      amount,
      date: new Date(row.Date),
      description: `1С Списание РС №${row.Number || "?"}: ${row.НазначениеПлатежа || ""}`.trim(),
    };
  },
  async upsert(externalId, data) {
    await prisma.financeTransaction.upsert({
      where: { externalId },
      update: {
        amount: data.amount,
        date: data.date,
        description: data.description,
      },
      create: {
        externalId,
        amount: data.amount,
        type: "EXPENSE" as FinanceType,
        category: "MAINTENANCE" as FinanceCategory,
        source: "BUDGET" as FinanceSource,
        date: data.date,
        description: data.description,
      },
    });
  },
};

// Реестр всех маппингов
const ALL_MAPPINGS: EntityMapping<any>[] = [
  inventoryMapping,
  supplierMapping,
  cashIncomeMapping,
  bankExpenseMapping,
];

// ───────────────────── Sync Engine ─────────────────────

class OneCSyncEngine {
  private client: AxiosInstance;

  constructor() {
    this.client = createOneCClient();
  }

  /**
   * Загрузить все записи сущности из OData с пагинацией
   */
  private async fetchAll(
    entity: string,
    select?: string,
    extraParams?: Record<string, string>
  ): Promise<any[]> {
    const allRows: any[] = [];
    const pageSize = 500;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const params: Record<string, string> = {
        $format: "json",
        $top: String(pageSize),
        $skip: String(skip),
        ...extraParams,
      };
      if (select) params.$select = select;

      const url = encodeURIComponent(entity);
      const response = await this.client.get(url, { params });

      // OData v3: data.d.results || data.d; OData v4: data.value
      const data = response.data;
      let rows: any[];

      if (Array.isArray(data?.value)) {
        rows = data.value;
      } else if (Array.isArray(data?.d?.results)) {
        rows = data.d.results;
      } else if (Array.isArray(data?.d)) {
        rows = data.d;
      } else {
        rows = [];
        hasMore = false;
      }

      allRows.push(...rows);
      skip += pageSize;

      if (rows.length < pageSize) {
        hasMore = false;
      }
    }

    return allRows;
  }

  /**
   * Выполнить синхронизацию одного маппинга
   */
  private async syncMapping(mapping: EntityMapping<any>): Promise<SyncResult> {
    const start = Date.now();
    const result: SyncResult = {
      entity: mapping.label,
      fetched: 0,
      created: 0,
      updated: 0,
      errors: 0,
      durationMs: 0,
    };

    try {
      const rows = await this.fetchAll(
        mapping.odataEntity,
        mapping.select,
        mapping.extraParams
      );
      result.fetched = rows.length;

      for (const row of rows) {
        try {
          const transformed = mapping.transform(row);
          if (!transformed) continue;

          const externalId = row.Ref_Key as string;
          await mapping.upsert(externalId, transformed);

          // Грубый подсчёт create vs update (upsert не индицирует)
          result.created++;
        } catch (rowErr) {
          result.errors++;
          console.error(
            `  ⚠️ Ошибка upsert [${mapping.label}] Ref_Key=${row.Ref_Key}:`,
            (rowErr as Error).message
          );
        }
      }
    } catch (fetchErr) {
      if (isNetworkError(fetchErr)) {
        throw fetchErr; // прокинем наверх — 1С недоступен целиком
      }
      console.error(
        `  ❌ Ошибка загрузки [${mapping.label}]:`,
        (fetchErr as Error).message
      );
      result.errors = -1; // маркер полного сбоя маппинга
    }

    result.durationMs = Date.now() - start;
    return result;
  }

  /**
   * Полная синхронизация всех маппингов.
   * Если 1С недоступен — сразу возвращаем ошибку, не пробуем остальные.
   */
  async syncAll(): Promise<SyncReport> {
    const startedAt = new Date();
    const results: SyncResult[] = [];
    let networkDown = false;

    console.log(`\n🔄 [1C Sync] Запуск синхронизации — ${startedAt.toISOString()}`);

    for (const mapping of ALL_MAPPINGS) {
      if (networkDown) break;

      console.log(`  ▶ ${mapping.label}...`);
      try {
        const res = await this.syncMapping(mapping);
        results.push(res);
        console.log(
          `  ✅ ${mapping.label}: получено ${res.fetched}, upserted ${res.created}, ошибок ${res.errors} (${res.durationMs}ms)`
        );
      } catch (err) {
        if (isNetworkError(err)) {
          networkDown = true;
          console.error(
            `  ❌ 1С недоступен (${(err as any).code}). Синхронизация прервана.`
          );
        } else {
          results.push({
            entity: mapping.label,
            fetched: 0,
            created: 0,
            updated: 0,
            errors: -1,
            durationMs: 0,
          });
        }
      }
    }

    const finishedAt = new Date();
    const hasErrors = results.some((r) => r.errors !== 0);
    const allFailed = results.length === 0 || networkDown;

    const report: SyncReport = {
      startedAt,
      finishedAt,
      results,
      overallStatus: allFailed ? "failed" : hasErrors ? "partial" : "success",
    };

    console.log(
      `🔄 [1C Sync] Завершено: ${report.overallStatus} (${finishedAt.getTime() - startedAt.getTime()}ms)\n`
    );

    return report;
  }

  /**
   * Запустить cron-расписание синхронизации.
   * По умолчанию: каждые 30 минут.
   */
  startSchedule(): void {
    const schedule = config.oneCCronSchedule;

    if (!cron.validate(schedule)) {
      console.error(`❌ [1C Sync] Невалидное cron-выражение: ${schedule}`);
      return;
    }

    console.log(`⏰ [1C Sync] Расписание запущено: "${schedule}"`);

    cron.schedule(schedule, async () => {
      try {
        await this.syncAll();
      } catch (err) {
        console.error(
          "❌ [1C Sync] Критическая ошибка:",
          (err as Error).message
        );
      }
    });
  }

  /**
   * Выполнить разовую синхронизацию (для ручного вызова / API endpoint)
   */
  async runOnce(): Promise<SyncReport> {
    return this.syncAll();
  }
}

export const oneCSyncEngine = new OneCSyncEngine();
