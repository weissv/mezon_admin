import type { SyncContext, SyncResult } from "./sync-context";
import { logger } from "../../../../utils/logger";

async function syncGenericPayrollDocument(
  ctx: SyncContext,
  entity: string,
  docType: string,
  extractor: (row: any) => Record<string, any>,
): Promise<SyncResult> {
  const filter = "DeletionMark eq false";
  const rows = await ctx.fetchAll(entity, filter);
  let upserted = 0;
  let errors = 0;

  for (const r of rows as any[]) {
    try {
      const extra = extractor(r);
      const baseData = {
        docType,
        documentNumber: r.Number ?? null,
        date: r.Date ? new Date(r.Date) : new Date(),
        posted: r.Posted ?? false,
        comment: r.Комментарий ?? null,
        isActive: true,
        ...extra,
      };
      const db = ctx.db as any;
      await db.oneCPayrollDocument.upsert({
        where: { externalId: r.Ref_Key },
        create: { externalId: r.Ref_Key, ...baseData },
        update: baseData,
      });
      upserted++;
    } catch (err) {
      errors++;
      logger.error(`[1C-Sync] Payroll ${docType} upsert error for ${r.Ref_Key}:`, (err as Error).message);
    }
  }
  return { entity, fetched: rows.length, upserted, errors };
}

function syncPayrollAccrual(ctx: SyncContext) {
  return syncGenericPayrollDocument(ctx, "Document_НачислениеЗарплаты", "НачислениеЗарплаты", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
    period: r.МесяцНачисления ? new Date(r.МесяцНачисления) : null,
    amount: parseFloat(r.Начислено) || null,
  }));
}

function syncPayrollBankStatement(ctx: SyncContext) {
  return syncGenericPayrollDocument(ctx, "Document_ВедомостьНаВыплатуЗарплатыВБанк", "ВедомостьЗарплатыБанк", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
    period: r.ПериодРегистрации ? new Date(r.ПериодРегистрации) : null,
    amount: parseFloat(r.СуммаПоДокументу) || null,
  }));
}

function syncPayrollCashStatement(ctx: SyncContext) {
  return syncGenericPayrollDocument(ctx, "Document_ВедомостьНаВыплатуЗарплатыВКассу", "ВедомостьЗарплатыКасса", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
    period: r.ПериодРегистрации ? new Date(r.ПериодРегистрации) : null,
    amount: parseFloat(r.СуммаПоДокументу) || null,
  }));
}

function syncNDFLWithholding(ctx: SyncContext) {
  return syncGenericPayrollDocument(ctx, "Document_УдержаниеУИсточникаВыплатыНДФЛ", "УдержаниеНДФЛ", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
  }));
}

function syncPlannedAccrual(ctx: SyncContext) {
  return syncGenericPayrollDocument(ctx, "Document_НазначениеПлановогоНачисления", "НазначениеПлановогоНачисления", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
  }));
}

function syncPlannedDeduction(ctx: SyncContext) {
  return syncGenericPayrollDocument(ctx, "Document_НазначениеПлановогоУдержания", "НазначениеПлановогоУдержания", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
  }));
}

function syncPlannedAccrualCancellation(ctx: SyncContext) {
  return syncGenericPayrollDocument(ctx, "Document_ПрекращениеПлановогоНачисления", "ПрекращениеПлановогоНачисления", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
  }));
}

export function payrollSyncSteps(ctx: SyncContext) {
  return [
    () => syncPayrollAccrual(ctx),
    () => syncPayrollBankStatement(ctx),
    () => syncPayrollCashStatement(ctx),
    () => syncNDFLWithholding(ctx),
    () => syncPlannedAccrual(ctx),
    () => syncPlannedDeduction(ctx),
    () => syncPlannedAccrualCancellation(ctx),
  ];
}
