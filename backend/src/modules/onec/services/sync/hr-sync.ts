import type { SyncContext, SyncResult } from "./sync-context";
import { logger } from "../../../../utils/logger";

function syncGenericHRDocument(
  ctx: SyncContext,
  entity: string,
  docType: string,
  extractor: (row: any) => Record<string, any>,
): Promise<SyncResult> {
  return syncGenericDocument(ctx, entity, docType, "oneCHRDocument", extractor);
}

async function syncGenericDocument(
  ctx: SyncContext,
  entity: string,
  docType: string,
  model: "oneCHRDocument",
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
      await db[model].upsert({
        where: { externalId: r.Ref_Key },
        create: { externalId: r.Ref_Key, ...baseData },
        update: baseData,
      });
      upserted++;
    } catch (err) {
      errors++;
      logger.error(`[1C-Sync] HR ${docType} upsert error for ${r.Ref_Key}:`, (err as Error).message);
    }
  }
  return { entity, fetched: rows.length, upserted, errors };
}

function syncHiring(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_ПриемНаРаботу", "ПриемНаРаботу", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    employeeName: null,
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
    positionRefKey: r.Должность_Key ?? null,
    dateStart: r.ДатаПриема ? new Date(r.ДатаПриема) : null,
    meta: { ВидЗанятости: r.ВидЗанятости, КоличествоСтавок: r.КоличествоСтавок },
  }));
}

function syncDismissal(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_Увольнение", "Увольнение", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    dateStart: r.ДатаУвольнения ? new Date(r.ДатаУвольнения) : null,
    meta: { ОснованиеУвольнения: r.ОснованиеУвольнения },
  }));
}

function syncTransfer(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_КадровыйПеревод", "КадровыйПеревод", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
    positionRefKey: r.Должность_Key ?? null,
    dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
  }));
}

function syncVacation(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_Отпуск", "Отпуск", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    dateStart: r.ДатаНачалаОсновногоОтпуска ? new Date(r.ДатаНачалаОсновногоОтпуска) : null,
    dateEnd: r.ДатаОкончанияОсновногоОтпуска ? new Date(r.ДатаОкончанияОсновногоОтпуска) : null,
    amount: parseFloat(r.Начислено) || null,
    meta: { КоличествоДнейОсновногоОтпуска: r.КоличествоДнейОсновногоОтпуска },
  }));
}

function syncSickLeave(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_БольничныйЛист", "БольничныйЛист", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
    dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
    amount: parseFloat(r.Начислено) || null,
    meta: { ПричинаНетрудоспособности: r.ПричинаНетрудоспособности },
  }));
}

function syncAbsence(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_ОтсутствиеНаРаботе", "ОтсутствиеНаРаботе", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
  }));
}

function syncBusinessTrip(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_Командировка", "Командировка", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
    dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
    meta: { СтранаНазначения: r.СтранаНазначения, Цель: r.Цель },
  }));
}

function syncGPHContract(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_ДоговорГПХ", "ДоговорГПХ", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
    positionRefKey: r.Должность_Key ?? null,
    dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
    dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
    amount: parseFloat(r.Размер) || null,
  }));
}

function syncGPHAct(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_АктВыполненныхРаботПоДоговоруПодряда", "АктВыполненныхРабот", (r) => ({
    employeeRefKey: r.Сотрудник_Key ?? null,
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
    dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
    amount: parseFloat(r.Размер) || null,
  }));
}

function syncExecutionList(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_ИсполнительныйЛист", "ИсполнительныйЛист", (r) => ({
    personRefKey: r.ФизическоеЛицо_Key ?? null,
    orgRefKey: r.Организация_Key ?? null,
    dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
    amount: parseFloat(r.Сумма) || null,
  }));
}

function syncTimesheet(ctx: SyncContext) {
  return syncGenericHRDocument(ctx, "Document_ТабельУчетаРабочегоВремени", "ТабельУчетаРабочегоВремени", (r) => ({
    orgRefKey: r.Организация_Key ?? null,
    departmentRefKey: r.Подразделение_Key ?? null,
    dateStart: r.ДатаНачалаПериода ? new Date(r.ДатаНачалаПериода) : null,
    dateEnd: r.ДатаОкончанияПериода ? new Date(r.ДатаОкончанияПериода) : null,
  }));
}

export function hrSyncSteps(ctx: SyncContext) {
  return [
    () => syncHiring(ctx),
    () => syncDismissal(ctx),
    () => syncTransfer(ctx),
    () => syncVacation(ctx),
    () => syncSickLeave(ctx),
    () => syncAbsence(ctx),
    () => syncBusinessTrip(ctx),
    () => syncGPHContract(ctx),
    () => syncGPHAct(ctx),
    () => syncExecutionList(ctx),
    () => syncTimesheet(ctx),
  ];
}
