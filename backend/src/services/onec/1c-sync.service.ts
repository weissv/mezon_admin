/**
 * 1C:Enterprise → ERP synchronization service.
 *
 * Syncs catalogs (Contractors, Persons, CashFlowArticles) first,
 * then finance documents (PKO, RKO, BankIn, BankOut),
 * then invoices (Incoming, Outgoing), then recalculates balance snapshots.
 *
 * Uses OData v3 with $top/$skip pagination.
 */

import cron from "node-cron";
import { createHash } from "node:crypto";
import { AxiosInstance } from "axios";
import { PrismaClient, TransactionChannel, InvoiceDirection, BalanceType } from "@prisma/client";

import { config } from "../../config";
import { prisma } from "../../prisma";
import { createOneCClient, isNetworkError } from "./onec-client";

// ─── Types ─────────────────────────────────────────────────────

interface SyncResult {
  entity: string;
  fetched: number;
  upserted: number;
  errors: number;
}

interface SyncReport {
  startedAt: Date;
  finishedAt: Date;
  results: SyncResult[];
  aborted: boolean;
  error?: string;
}

// ─── Constants ─────────────────────────────────────────────────

const PAGE_SIZE = 500;
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

// ─── Service ───────────────────────────────────────────────────

export class OneCSyncService {
  private client: AxiosInstance;
  private db: PrismaClient;

  constructor(client?: AxiosInstance, db?: PrismaClient) {
    this.client = client ?? createOneCClient();
    this.db = db ?? prisma;
  }

  // ── Generic paginated fetch ──────────────────────────────────

  private async fetchAll<T = Record<string, unknown>>(
    entity: string,
    filter?: string,
    select?: string,
  ): Promise<T[]> {
    const results: T[] = [];
    let skip = 0;

    const params: Record<string, string> = {
      $format: "json",
      $top: String(PAGE_SIZE),
    };
    if (filter) params.$filter = filter;
    if (select) params.$select = select;

    while (true) {
      params.$skip = String(skip);

      const url = `/${encodeURIComponent(entity)}`;
      const resp = await this.client.get(url, { params });

      const items: T[] = resp.data?.value ?? [];
      results.push(...items);

      if (items.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    return results;
  }

  private buildRegisterExternalId(registerType: string, row: Record<string, unknown>): string {
    if (typeof row.Ref_Key === "string" && row.Ref_Key) {
      return row.Ref_Key;
    }

    const normalizedEntries = Object.entries(row)
      .filter(([key]) => key !== "DataVersion")
      .sort(([left], [right]) => left.localeCompare(right));

    const normalizedRow = Object.fromEntries(normalizedEntries);
    const payload = JSON.stringify(normalizedRow);
    return `${registerType}_${createHash("sha256").update(payload).digest("hex")}`;
  }

  // ── Catalog syncs (run FIRST for FK resolution) ──────────────

  async syncContractors(): Promise<SyncResult> {
    const entity = "Catalog_Контрагенты";
    const filter = "DeletionMark eq false";
    const select = "Ref_Key,Code,Description,НаименованиеПолное,ИНН,КПП,IsFolder,DeletionMark";

    const rows = await this.fetchAll(entity, filter, select);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        await this.db.contractor.upsert({
          where: { externalId: r.Ref_Key },
          create: {
            externalId: r.Ref_Key,
            code: r.Code ?? null,
            name: r.Description ?? "—",
            fullName: r.НаименованиеПолное ?? null,
            inn: r.ИНН ?? null,
            kpp: r.КПП ?? null,
            isFolder: r.IsFolder ?? false,
            isActive: !r.DeletionMark,
          },
          update: {
            code: r.Code ?? null,
            name: r.Description ?? "—",
            fullName: r.НаименованиеПолное ?? null,
            inn: r.ИНН ?? null,
            kpp: r.КПП ?? null,
            isFolder: r.IsFolder ?? false,
            isActive: !r.DeletionMark,
          },
        });
        upserted++;
      } catch (err) {
        errors++;
        console.error(`[1C-Sync] Contractor upsert error:`, (err as Error).message);
      }
    }

    return { entity, fetched: rows.length, upserted, errors };
  }

  async syncPersons(): Promise<SyncResult> {
    const entity = "Catalog_ФизическиеЛица";
    const filter = "DeletionMark eq false";
    const select = "Ref_Key,Code,Description,DeletionMark";

    const rows = await this.fetchAll(entity, filter, select);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        await this.db.person.upsert({
          where: { externalId: r.Ref_Key },
          create: {
            externalId: r.Ref_Key,
            code: r.Code ?? null,
            name: r.Description ?? "—",
            isActive: !r.DeletionMark,
          },
          update: {
            code: r.Code ?? null,
            name: r.Description ?? "—",
            isActive: !r.DeletionMark,
          },
        });
        upserted++;
      } catch (err) {
        errors++;
        console.error(`[1C-Sync] Person upsert error:`, (err as Error).message);
      }
    }

    return { entity, fetched: rows.length, upserted, errors };
  }

  async syncCashFlowArticles(): Promise<SyncResult> {
    const entity = "Catalog_СтатьиДвиженияДенежныхСредств";
    const filter = "DeletionMark eq false";
    const select = "Ref_Key,Code,Description,IsFolder,DeletionMark";

    const rows = await this.fetchAll(entity, filter, select);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        await this.db.cashFlowArticle.upsert({
          where: { externalId: r.Ref_Key },
          create: {
            externalId: r.Ref_Key,
            code: r.Code ?? null,
            name: r.Description ?? "—",
            isFolder: r.IsFolder ?? false,
          },
          update: {
            code: r.Code ?? null,
            name: r.Description ?? "—",
            isFolder: r.IsFolder ?? false,
          },
        });
        upserted++;
      } catch (err) {
        errors++;
        console.error(`[1C-Sync] CashFlowArticle upsert error:`, (err as Error).message);
      }
    }

    return { entity, fetched: rows.length, upserted, errors };
  }

  // ── Counterparty resolution helpers ──────────────────────────

  private async resolveContractorId(refKey: string | null | undefined): Promise<number | null> {
    if (!refKey || refKey === EMPTY_GUID) return null;
    const row = await this.db.contractor.findUnique({ where: { externalId: refKey }, select: { id: true } });
    return row?.id ?? null;
  }

  private async resolvePersonId(refKey: string | null | undefined): Promise<number | null> {
    if (!refKey || refKey === EMPTY_GUID) return null;
    const row = await this.db.person.findUnique({ where: { externalId: refKey }, select: { id: true } });
    return row?.id ?? null;
  }

  private async resolveCashFlowArticleId(refKey: string | null | undefined): Promise<number | null> {
    if (!refKey || refKey === EMPTY_GUID) return null;
    const row = await this.db.cashFlowArticle.findUnique({ where: { externalId: refKey }, select: { id: true } });
    return row?.id ?? null;
  }

  /**
   * Polymorphic counterparty resolution.
   * Finance documents store counterparty as Контрагент (GUID) + Контрагент_Type.
   */
  private async resolveCounterparty(
    refKey: string | null | undefined,
    type: string | null | undefined,
  ): Promise<{ contractorId: number | null; personId: number | null }> {
    if (!refKey || refKey === EMPTY_GUID) return { contractorId: null, personId: null };

    if (type?.includes("Catalog_Контрагенты")) {
      return { contractorId: await this.resolveContractorId(refKey), personId: null };
    }
    if (type?.includes("Catalog_ФизическиеЛица")) {
      return { contractorId: null, personId: await this.resolvePersonId(refKey) };
    }

    // Unknown type — try contractor first, then person
    const cId = await this.resolveContractorId(refKey);
    if (cId) return { contractorId: cId, personId: null };
    const pId = await this.resolvePersonId(refKey);
    return { contractorId: null, personId: pId };
  }

  // ── Finance document syncs ───────────────────────────────────

  /**
   * Generic finance document sync.
   * @param entity       OData entity set name
   * @param label        Human-readable label for logs
   * @param channel      CASH or BANK
   * @param sign         +1 (income) or -1 (expense)
   */
  private async syncFinanceDoc(
    entity: string,
    label: string,
    channel: TransactionChannel,
    sign: 1 | -1,
  ): Promise<SyncResult> {
    const filter = "DeletionMark eq false";
    const rows = await this.fetchAll(entity, filter);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        const rawAmount = parseFloat(r.СуммаДокумента) || 0;
        const amount = rawAmount * sign;
        const date = new Date(r.Date);

        const { contractorId, personId } = await this.resolveCounterparty(
          r.Контрагент,
          r.Контрагент_Type,
        );
        const cashFlowArticleId = await this.resolveCashFlowArticleId(
          r.СтатьяДвиженияДенежныхСредств_Key,
        );

        const purpose =
          r.НазначениеПлатежа ?? r.Основание ?? r.Комментарий ?? null;

        await this.db.financeTransaction.upsert({
          where: { externalId: r.Ref_Key },
          create: {
            externalId: r.Ref_Key,
            amount,
            type: sign > 0 ? "INCOME" : "EXPENSE",
            category: "OTHER",
            source: "BUDGET",
            description: r.Комментарий ?? label,
            date,
            channel,
            documentNumber: r.Number ?? null,
            operationType: r.ВидОперации ?? null,
            posted: r.Posted ?? false,
            counterpartyType: r.Контрагент_Type ?? null,
            counterpartyRefKey: r.Контрагент ?? null,
            contractorId,
            personId,
            cashFlowArticleId,
            purpose,
          },
          update: {
            amount,
            type: sign > 0 ? "INCOME" : "EXPENSE",
            description: r.Комментарий ?? label,
            date,
            channel,
            documentNumber: r.Number ?? null,
            operationType: r.ВидОперации ?? null,
            posted: r.Posted ?? false,
            counterpartyType: r.Контрагент_Type ?? null,
            counterpartyRefKey: r.Контрагент ?? null,
            contractorId,
            personId,
            cashFlowArticleId,
            purpose,
          },
        });
        upserted++;
      } catch (err) {
        errors++;
        console.error(`[1C-Sync] ${label} upsert error:`, (err as Error).message);
      }
    }

    return { entity, fetched: rows.length, upserted, errors };
  }

  // ── Invoice syncs ────────────────────────────────────────────

  private extractInvoiceContractorRefKey(row: any): string | null {
    if (row.Контрагент_Key) return row.Контрагент_Key;

    const firstContractor = Array.isArray(row.Контрагенты) ? row.Контрагенты[0] : null;
    if (firstContractor?.Контрагент_Key) return firstContractor.Контрагент_Key;

    return null;
  }

  /**
   * Generic invoice document sync.
   * Invoice docs use Контрагент_Key (direct ref to Catalog_Контрагенты).
   */
  private async syncInvoiceDoc(
    entity: string,
    label: string,
    direction: InvoiceDirection,
    options?: {
      contractorRefExtractor?: (row: any) => string | null;
      totalAmountExtractor?: (row: any) => number;
      commentExtractor?: (row: any) => string | null;
      operationTypeExtractor?: (row: any) => string | null;
    },
  ): Promise<SyncResult> {
    const filter = "DeletionMark eq false";
    const rows = await this.fetchAll(entity, filter);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        const contractorRefKey = options?.contractorRefExtractor
          ? options.contractorRefExtractor(r)
          : this.extractInvoiceContractorRefKey(r);
        const contractorId = await this.resolveContractorId(contractorRefKey);
        const totalAmount = options?.totalAmountExtractor
          ? options.totalAmountExtractor(r)
          : parseFloat(r.СуммаДокумента) || 0;
        const operationType = options?.operationTypeExtractor
          ? options.operationTypeExtractor(r)
          : r.ВидОперации ?? null;
        const comment = options?.commentExtractor
          ? options.commentExtractor(r)
          : r.Комментарий ?? null;

        await this.db.invoice.upsert({
          where: { externalId: r.Ref_Key },
          create: {
            externalId: r.Ref_Key,
            direction,
            documentNumber: r.Number ?? null,
            date: new Date(r.Date),
            posted: r.Posted ?? false,
            operationType,
            contractorId,
            totalAmount,
            comment,
          },
          update: {
            direction,
            documentNumber: r.Number ?? null,
            date: new Date(r.Date),
            posted: r.Posted ?? false,
            operationType,
            contractorId,
            totalAmount,
            comment,
          },
        });
        upserted++;
      } catch (err) {
        errors++;
        console.error(`[1C-Sync] ${label} upsert error:`, (err as Error).message);
      }
    }

    return { entity, fetched: rows.length, upserted, errors };
  }

  // ── Balance snapshot recalculation ───────────────────────────

  async syncBalanceSnapshots(): Promise<SyncResult> {
    const entity = "BalanceSnapshot (calculated)";
    const now = new Date();
    let upserted = 0;
    let errors = 0;

    try {
      // Cash balance = sum of all CASH channel transactions
      const cashAgg = await this.db.financeTransaction.aggregate({
        where: { channel: "CASH" },
        _sum: { amount: true },
      });
      await this.db.balanceSnapshot.create({
        data: {
          snapshotDate: now,
          balanceType: "CASH",
          amount: cashAgg._sum.amount ?? 0,
          label: "Касса",
        },
      });
      upserted++;

      // Bank balance = sum of all BANK channel transactions
      const bankAgg = await this.db.financeTransaction.aggregate({
        where: { channel: "BANK" },
        _sum: { amount: true },
      });
      await this.db.balanceSnapshot.create({
        data: {
          snapshotDate: now,
          balanceType: "BANK",
          amount: bankAgg._sum.amount ?? 0,
          label: "Расчётный счёт",
        },
      });
      upserted++;

      // Top contractor debts (saldo by contractor)
      const contractorDebts: { contractorId: number; _sum: { amount: number | null } }[] =
        await this.db.financeTransaction.groupBy({
          by: ["contractorId"],
          where: { contractorId: { not: null } },
          _sum: { amount: true },
        }) as any;

      for (const row of contractorDebts) {
        if (!row.contractorId) continue;
        try {
          const contractor = await this.db.contractor.findUnique({
            where: { id: row.contractorId },
            select: { name: true },
          });
          await this.db.balanceSnapshot.create({
            data: {
              snapshotDate: now,
              balanceType: "CONTRACTOR_DEBT",
              amount: row._sum.amount ?? 0,
              contractorId: row.contractorId,
              label: contractor?.name ?? `Контрагент #${row.contractorId}`,
            },
          });
          upserted++;
        } catch (err) {
          errors++;
          console.error(`[1C-Sync] BalanceSnapshot contractor debt error:`, (err as Error).message);
        }
      }
    } catch (err) {
      errors++;
      console.error(`[1C-Sync] BalanceSnapshot aggregate error:`, (err as Error).message);
    }

    return { entity, fetched: 0, upserted, errors };
  }

  // ── Generic catalog sync ──────────────────────────────────────

  private async syncGenericCatalog(
    entity: string,
    model: string,
    fieldMap: Record<string, string>,
    selectFields?: string,
  ): Promise<SyncResult> {
    const filter = "DeletionMark eq false";
    const rows = await this.fetchAll(entity, filter, selectFields);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        const data: Record<string, any> = { isActive: true };
        for (const [oneCField, dbField] of Object.entries(fieldMap)) {
          data[dbField] = r[oneCField] ?? null;
        }
        data.name = data.name || r.Description || "—";
        const db = this.db as any;
        await db[model].upsert({
          where: { externalId: r.Ref_Key },
          create: { externalId: r.Ref_Key, ...data },
          update: data,
        });
        upserted++;
      } catch (err) {
        errors++;
      }
    }
    return { entity, fetched: rows.length, upserted, errors };
  }

  // ── Extended catalog syncs ──────────────────────────────────

  async syncOrganizations(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_Организации", "oneCOrganization",
      { Code: "code", Description: "name", НаименованиеПолное: "fullName", ИНН: "inn", КПП: "kpp", ОГРН: "ogrn" },
    );
  }

  async syncNomenclature(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_Номенклатура", "oneCNomenclature",
      { Code: "code", Description: "name", НаименованиеПолное: "fullName", IsFolder: "isFolder" },
    );
  }

  async syncBankAccounts(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_БанковскиеСчета", "oneCBankAccount",
      { Code: "code", Description: "name", НомерСчета: "accountNumber" },
    );
  }

  async syncContracts(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_ДоговорыКонтрагентов", "oneCContract",
      { Code: "code", Description: "name", Owner_Key: "contractorRefKey" },
    );
  }

  async syncOneCEmployees(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_Сотрудники", "oneCEmployee",
      { Code: "code", Description: "name", ФизическоеЛицо_Key: "personRefKey", Должность_Key: "positionRefKey", Организация_Key: "orgRefKey" },
    );
  }

  async syncPositions(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_Должности", "oneCPosition",
      { Code: "code", Description: "name" },
    );
  }

  async syncFixedAssets(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_ОсновныеСредства", "oneCFixedAsset",
      { Code: "code", Description: "name", НаименованиеПолное: "fullName", IsFolder: "isFolder" },
    );
  }

  async syncWarehouses(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_Склады", "oneCWarehouse",
      { Code: "code", Description: "name" },
    );
  }

  async syncCurrencies(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_Валюты", "oneCCurrency",
      { Code: "code", Description: "name" },
    );
  }

  async syncDepartments(): Promise<SyncResult> {
    return this.syncGenericCatalog(
      "Catalog_ПодразделенияОрганизаций", "oneCDepartment",
      { Code: "code", Description: "name", Parent_Key: "parentRefKey", Owner_Key: "orgRefKey" },
    );
  }

  // ── Generic 1C document sync ────────────────────────────────

  private async syncGenericDocument(
    entity: string,
    docType: string,
    model: "oneCDocument" | "oneCHRDocument" | "oneCPayrollDocument",
    extractor: (row: any) => Record<string, any>,
  ): Promise<SyncResult> {
    const filter = "DeletionMark eq false";
    const rows = await this.fetchAll(entity, filter);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        const extra = extractor(r);
        const baseData = {
          docType,
          documentNumber: r.Number ?? null,
          date: new Date(r.Date),
          posted: r.Posted ?? false,
          comment: r.Комментарий ?? null,
          isActive: true,
          ...extra,
        };
        const db = this.db as any;
        await db[model].upsert({
          where: { externalId: r.Ref_Key },
          create: { externalId: r.Ref_Key, ...baseData },
          update: baseData,
        });
        upserted++;
      } catch (err) {
        errors++;
      }
    }
    return { entity, fetched: rows.length, upserted, errors };
  }

  // ── Finance document syncs (generic 1C document model) ──────

  async syncAccountingEntries(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ОперацияБух", "ОперацияБух", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаОперации) || null,
      operationType: r.Содержание ?? null,
      meta: { СпособЗаполнения: r.СпособЗаполнения },
    }));
  }

  async syncDebtCorrections(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_КорректировкаДолга", "КорректировкаДолга", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаКтЗадолженности) || parseFloat(r.СуммаДтЗадолженности) || null,
      operationType: r.ВидОперации ?? null,
      contractorRefKey: r.КонтрагентДебитор_Key ?? r.КонтрагентКредитор_Key ?? null,
    }));
  }

  async syncReceivedInvoices(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_СчетФактураПолученный", "СчетФактураПолученный", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      contractorRefKey: r.Контрагент_Key ?? null,
      operationType: r.ВидСчетаФактуры ?? null,
    }));
  }

  async syncIssuedInvoices(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_СчетФактураВыданный", "СчетФактураВыданный", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      contractorRefKey: r.Контрагент_Key ?? null,
      operationType: r.ВидСчетаФактуры ?? null,
    }));
  }

  async syncAdvanceReports(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_АвансовыйОтчет", "АвансовыйОтчет", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      personRefKey: r.ФизЛицо_Key ?? null,
    }));
  }

  async syncCustomerInvoices(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_СчетНаОплатуПокупателю", "СчетНаОплатуПокупателю", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      contractorRefKey: r.Контрагент_Key ?? null,
    }));
  }

  async syncContractorSettlements(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ДокументРасчетовСКонтрагентом", "ДокументРасчетовСКонтрагентом", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      contractorRefKey: r.Контрагент_Key ?? null,
    }));
  }

  async syncPenaltyCharges(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_НачислениеПеней", "НачислениеПеней", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      contractorRefKey: r.Контрагент_Key ?? null,
      meta: { СтавкаПени: r.СтавкаПени, ПериодРасчета: r.ПериодРасчета },
    }));
  }

  async syncDividends(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_НачислениеДивидендов", "НачислениеДивидендов", "oneCDocument", (r) => ({
      operationType: r.ВидОперации ?? null,
    }));
  }

  async syncRegOperations(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_РегламентнаяОперация", "РегламентнаяОперация", "oneCDocument", (r) => ({
      operationType: r.ВидОперации ?? null,
      meta: { Состояние: r.Состояние },
    }));
  }

  // ── Inventory / warehouse documents ─────────────────────────

  async syncGoodsWriteOff(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_СписаниеТоваров", "СписаниеТоваров", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      meta: { Основание: r.Основание },
    }));
  }

  async syncInventoryCheck(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ИнвентаризацияТоваровНаСкладе", "ИнвентаризацияТоваровНаСкладе", "oneCDocument", (r) => ({
      meta: { ДатаНачалаИнвентаризации: r.ДатаНачалаИнвентаризации, ДатаОкончанияИнвентаризации: r.ДатаОкончанияИнвентаризации },
    }));
  }

  async syncDemandInvoice(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ТребованиеНакладная", "ТребованиеНакладная", "oneCDocument", (r) => ({
      contractorRefKey: r.Контрагент_Key ?? null,
    }));
  }

  async syncGoodsTransfer(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПеремещениеТоваров", "ПеремещениеТоваров", "oneCDocument", (r) => ({
      meta: { СкладОтправитель_Key: r.СкладОтправитель_Key, СкладПолучатель_Key: r.СкладПолучатель_Key },
    }));
  }

  async syncNomenclatureAssembly(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_КомплектацияНоменклатуры", "КомплектацияНоменклатуры", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      operationType: r.ВидОперации ?? null,
    }));
  }

  async syncFixedAssetAcceptance(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПринятиеКУчетуОС", "ПринятиеКУчетуОС", "oneCDocument", (r) => ({
      amount: parseFloat(r.СтоимостьБУ) || null,
      operationType: r.ВидОперации ?? null,
    }));
  }

  async syncAdditionalExpenses(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПоступлениеДопРасходов", "ПоступлениеДопРасходов", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      contractorRefKey: r.Контрагент_Key ?? null,
    }));
  }

  async syncRetailSalesReport(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ОтчетОРозничныхПродажах", "ОтчетОРозничныхПродажах", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
    }));
  }

  async syncPaymentOrder(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПлатежноеПоручение", "ПлатежноеПоручение", "oneCDocument", (r) => ({
      amount: parseFloat(r.СуммаДокумента) || null,
      contractorRefKey: r.Контрагент ?? null,
      meta: { НазначениеПлатежа: r.НазначениеПлатежа },
    }));
  }

  async syncInitialBalances(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ВводНачальныхОстатков", "ВводНачальныхОстатков", "oneCDocument", (r) => ({
      operationType: r.РазделУчета ?? null,
    }));
  }

  async syncMaterialTransfer(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПередачаМатериаловВЭксплуатацию", "ПередачаМатериаловВЭксплуатацию", "oneCDocument", (r) => ({}));
  }

  async syncMaterialWriteOff(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_СписаниеМатериаловИзЭксплуатации", "СписаниеМатериаловИзЭксплуатации", "oneCDocument", (r) => ({}));
  }

  async syncRegReports(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_РегламентированныйОтчет", "РегламентированныйОтчет", "oneCDocument", (r) => ({
      operationType: r.Вид ?? null,
      meta: { Период: r.Период, НаименованиеОтчета: r.НаименованиеОтчета },
    }));
  }

  async syncWarrant(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_Доверенность", "Доверенность", "oneCDocument", (r) => ({
      contractorRefKey: r.Контрагент_Key ?? null,
      personRefKey: r.ФизЛицо_Key ?? null,
    }));
  }

  async syncWaybill(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПутевойЛист", "ПутевойЛист", "oneCDocument", (r) => ({
      personRefKey: r.ФизЛицо_Key ?? null,
      meta: { ТранспортноеСредство_Key: r.ТранспортноеСредство_Key, НормаРасхода: r.НормаРасхода },
    }));
  }

  // ── HR documents ────────────────────────────────────────────

  async syncHiring(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПриемНаРаботу", "ПриемНаРаботу", "oneCHRDocument", (r) => ({
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

  async syncDismissal(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_Увольнение", "Увольнение", "oneCHRDocument", (r) => ({
      employeeRefKey: r.Сотрудник_Key ?? null,
      personRefKey: r.ФизическоеЛицо_Key ?? null,
      orgRefKey: r.Организация_Key ?? null,
      dateStart: r.ДатаУвольнения ? new Date(r.ДатаУвольнения) : null,
      meta: { ОснованиеУвольнения: r.ОснованиеУвольнения },
    }));
  }

  async syncTransfer(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_КадровыйПеревод", "КадровыйПеревод", "oneCHRDocument", (r) => ({
      employeeRefKey: r.Сотрудник_Key ?? null,
      personRefKey: r.ФизическоеЛицо_Key ?? null,
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
      positionRefKey: r.Должность_Key ?? null,
      dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
    }));
  }

  async syncVacation(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_Отпуск", "Отпуск", "oneCHRDocument", (r) => ({
      employeeRefKey: r.Сотрудник_Key ?? null,
      personRefKey: r.ФизическоеЛицо_Key ?? null,
      orgRefKey: r.Организация_Key ?? null,
      dateStart: r.ДатаНачалаОсновногоОтпуска ? new Date(r.ДатаНачалаОсновногоОтпуска) : null,
      dateEnd: r.ДатаОкончанияОсновногоОтпуска ? new Date(r.ДатаОкончанияОсновногоОтпуска) : null,
      amount: parseFloat(r.Начислено) || null,
      meta: { КоличествоДнейОсновногоОтпуска: r.КоличествоДнейОсновногоОтпуска },
    }));
  }

  async syncSickLeave(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_БольничныйЛист", "БольничныйЛист", "oneCHRDocument", (r) => ({
      employeeRefKey: r.Сотрудник_Key ?? null,
      personRefKey: r.ФизическоеЛицо_Key ?? null,
      orgRefKey: r.Организация_Key ?? null,
      dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
      dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
      amount: parseFloat(r.Начислено) || null,
      meta: { ПричинаНетрудоспособности: r.ПричинаНетрудоспособности },
    }));
  }

  async syncAbsence(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ОтсутствиеНаРаботе", "ОтсутствиеНаРаботе", "oneCHRDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
    }));
  }

  async syncBusinessTrip(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_Командировка", "Командировка", "oneCHRDocument", (r) => ({
      employeeRefKey: r.Сотрудник_Key ?? null,
      orgRefKey: r.Организация_Key ?? null,
      dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
      dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
      meta: { СтранаНазначения: r.СтранаНазначения, Цель: r.Цель },
    }));
  }

  async syncGPHContract(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ДоговорГПХ", "ДоговорГПХ", "oneCHRDocument", (r) => ({
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

  async syncGPHAct(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_АктВыполненныхРаботПоДоговоруПодряда", "АктВыполненныхРабот", "oneCHRDocument", (r) => ({
      employeeRefKey: r.Сотрудник_Key ?? null,
      personRefKey: r.ФизическоеЛицо_Key ?? null,
      orgRefKey: r.Организация_Key ?? null,
      dateStart: r.ДатаНачала ? new Date(r.ДатаНачала) : null,
      dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
      amount: parseFloat(r.Размер) || null,
    }));
  }

  async syncExecutionList(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ИсполнительныйЛист", "ИсполнительныйЛист", "oneCHRDocument", (r) => ({
      personRefKey: r.ФизическоеЛицо_Key ?? null,
      orgRefKey: r.Организация_Key ?? null,
      dateEnd: r.ДатаОкончания ? new Date(r.ДатаОкончания) : null,
      amount: parseFloat(r.Сумма) || null,
    }));
  }

  async syncTimesheet(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ТабельУчетаРабочегоВремени", "ТабельУчетаРабочегоВремени", "oneCHRDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
      dateStart: r.ДатаНачалаПериода ? new Date(r.ДатаНачалаПериода) : null,
      dateEnd: r.ДатаОкончанияПериода ? new Date(r.ДатаОкончанияПериода) : null,
    }));
  }

  // ── Payroll documents ────────────────────────────────────────

  async syncPayrollAccrual(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_НачислениеЗарплаты", "НачислениеЗарплаты", "oneCPayrollDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
      period: r.МесяцНачисления ? new Date(r.МесяцНачисления) : null,
      amount: parseFloat(r.Начислено) || null,
    }));
  }

  async syncPayrollBankStatement(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ВедомостьНаВыплатуЗарплатыВБанк", "ВедомостьЗарплатыБанк", "oneCPayrollDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
      period: r.ПериодРегистрации ? new Date(r.ПериодРегистрации) : null,
      amount: parseFloat(r.СуммаПоДокументу) || null,
    }));
  }

  async syncPayrollCashStatement(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ВедомостьНаВыплатуЗарплатыВКассу", "ВедомостьЗарплатыКасса", "oneCPayrollDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
      period: r.ПериодРегистрации ? new Date(r.ПериодРегистрации) : null,
      amount: parseFloat(r.СуммаПоДокументу) || null,
    }));
  }

  async syncNDFLWithholding(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_УдержаниеУИсточникаВыплатыНДФЛ", "УдержаниеНДФЛ", "oneCPayrollDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
    }));
  }

  async syncPlannedAccrual(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_НазначениеПлановогоНачисления", "НазначениеПлановогоНачисления", "oneCPayrollDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
    }));
  }

  async syncPlannedDeduction(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_НазначениеПлановогоУдержания", "НазначениеПлановогоУдержания", "oneCPayrollDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
    }));
  }

  // ── Missing document ──────────────────────────────────────────

  async syncPlannedAccrualCancellation(): Promise<SyncResult> {
    return this.syncGenericDocument("Document_ПрекращениеПлановогоНачисления", "ПрекращениеПлановогоНачисления", "oneCPayrollDocument", (r) => ({
      orgRefKey: r.Организация_Key ?? null,
      departmentRefKey: r.Подразделение_Key ?? null,
    }));
  }

  // ── Universal catalog sync (OneCCatalog model) ─────────────

  private async syncUniversalCatalog(entityName: string): Promise<SyncResult> {
    const catalogType = entityName.replace("Catalog_", "");
    const filter = "DeletionMark eq false";
    const rows = await this.fetchAll(entityName, filter);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        const data: Record<string, any> = {
          catalogType,
          code: r.Code ?? null,
          name: r.Description || "—",
          fullName: r.НаименованиеПолное ?? null,
          isFolder: r.IsFolder ?? false,
          parentRefKey: r.Parent_Key && r.Parent_Key !== EMPTY_GUID ? r.Parent_Key : null,
          ownerRefKey: r.Owner_Key && r.Owner_Key !== EMPTY_GUID ? r.Owner_Key : null,
          isActive: true,
          meta: (() => {
            const m: Record<string, any> = {};
            for (const [k, v] of Object.entries(r)) {
              if (!["Ref_Key","Code","Description","НаименованиеПолное","IsFolder","DeletionMark","Parent_Key","Owner_Key","Predefined","PredefinedDataName","DataVersion"].includes(k)) {
                m[k] = v;
              }
            }
            return Object.keys(m).length > 0 ? m : null;
          })(),
        };
        const db = this.db as any;
        await db.oneCCatalog.upsert({
          where: { catalogType_externalId: { catalogType, externalId: r.Ref_Key } },
          create: { externalId: r.Ref_Key, ...data },
          update: data,
        });
        upserted++;
      } catch (err) {
        errors++;
      }
    }
    return { entity: entityName, fetched: rows.length, upserted, errors };
  }

  // ── Universal register sync (OneCRegister model) ────────────

  private async syncUniversalRegister(entityName: string): Promise<SyncResult> {
    const registerType = entityName.replace(/^(InformationRegister_|AccumulationRegister_)/, "");
    const registerKind = entityName.startsWith("AccumulationRegister_") ? "Accumulation" : "Information";
    const rows = await this.fetchAll(entityName);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      const refKey = this.buildRegisterExternalId(registerType, r);
      try {
        const data: Record<string, any> = {
          registerType,
          registerKind,
          period: r.Period ? new Date(r.Period) : null,
          recorder: r.Recorder_Key && r.Recorder_Key !== EMPTY_GUID ? r.Recorder_Key : null,
          recorderType: r.Recorder_Type ?? null,
          lineNumber: r.LineNumber ?? null,
          active: r.Active !== false,
          data: (() => {
            const m: Record<string, any> = {};
            for (const [k, v] of Object.entries(r)) {
              if (!["Ref_Key","Period","Recorder_Key","Recorder_Type","Recorder","LineNumber","Active","DeletionMark","DataVersion"].includes(k)) {
                m[k] = v;
              }
            }
            return m;
          })(),
        };
        const db = this.db as any;
        await db.oneCRegister.upsert({
          where: { registerType_externalId: { registerType, externalId: refKey } },
          create: { externalId: refKey, ...data },
          update: data,
        });
        upserted++;
      } catch (err) {
        errors++;
      }
    }
    return { entity: entityName, fetched: rows.length, upserted, errors };
  }

  // ── Lists of all missing entities ───────────────────────────

  private static readonly MISSING_CATALOGS = [
    "Catalog_Банки",
    "Catalog_ВидыВзаиморасчетов",
    "Catalog_ВидыВычетовНДФЛ",
    "Catalog_ВидыДвиженийМСФО",
    "Catalog_ВидыДеятельностиITPark",
    "Catalog_ВидыДеятельностиПредпринимателей",
    "Catalog_ВидыДокументовФизическихЛиц",
    "Catalog_ВидыДоходовНДФЛ",
    "Catalog_ВидыДоходовПоСтраховымВзносам",
    "Catalog_ВидыИспользованияРабочегоВремени",
    "Catalog_ВидыКонтактнойИнформации",
    "Catalog_ВидыНалоговИПлатежейВБюджет",
    "Catalog_ВидыНоменклатуры",
    "Catalog_ВидыОбразованияФизЛиц",
    "Catalog_ВидыОплатОрганизаций",
    "Catalog_ВидыСтажа",
    "Catalog_ВнешниеИнформационныеБазы",
    "Catalog_ГрафикиРаботыСотрудников",
    "Catalog_Диагноз",
    "Catalog_ДополнительныеУсловия",
    "Catalog_ДрайверыОборудования",
    "Catalog_ЗарплатныеПроекты",
    "Catalog_ИдентификаторыОбъектовМетаданных",
    "Catalog_Календари",
    "Catalog_КассыОрганизаций",
    "Catalog_КлассификаторЕдиницИзмерения",
    "Catalog_КлассификаторЛьготПоНалогообложению",
    "Catalog_КонтактныеЛица",
    "Catalog_МетаданныеДляОграниченияДоступаДобавлениеИИзменение",
    "Catalog_МетаданныеДляОграниченияДоступаЧтения",
    "Catalog_НематериальныеАктивы",
    "Catalog_НоменклатурныеГруппы",
    "Catalog_ОбъектыСтроительства",
    "Catalog_ОснованияИсчисляемогоСтраховогоСтажа",
    "Catalog_ОснованияУвольнения",
    "Catalog_ПапкиФайлов",
    "Catalog_ПараметрыИсчисляемогоСтраховогоСтажа",
    "Catalog_ПараметрыРасчетаРезервовПоДЗ",
    "Catalog_Пользователи",
    "Catalog_ПредметыДоговора",
    "Catalog_ПричиныОбесцененияВНА",
    "Catalog_ПроизводственныеКалендари",
    "Catalog_ПрочиеДоходыИРасходы",
    "Catalog_РабочиеМеста",
    "Catalog_РазделыПланаСчетов",
    "Catalog_РасходыБудущихПериодов",
    "Catalog_РегистрацииВНалоговомОргане",
    "Catalog_Резервы",
    "Catalog_СП_ПоказателиРасчетаЗарплаты",
    "Catalog_Сборы",
    "Catalog_СобытияОС",
    "Catalog_СпособыВыплатыЗарплаты",
    "Catalog_СпособыОкругленияПриРасчетеЗарплаты",
    "Catalog_СпособыОтраженияЗарплатыВБухУчете",
    "Catalog_СпособыОтраженияРасходовПоАмортизации",
    "Catalog_СтатьиЗатрат",
    "Catalog_СтатьиЗатратНаПриобретение",
    "Catalog_СтепениРодстваФизЛиц",
    "Catalog_СтраныМира",
    "Catalog_ТерриториальныеУсловияПФР",
    "Catalog_ТипыБазДанных",
    "Catalog_ТипыДокументовПодтверждающихЛьготуНДС",
    "Catalog_ТипыЦенНоменклатуры",
    "Catalog_ТрудовыеДоговора",
    "Catalog_УдалитьДокументыУдостоверяющиеЛичность",
    "Catalog_УдалитьДоходыЕСН",
    "Catalog_УдалитьДоходыНДФЛ",
    "Catalog_УдалитьДоходыПоСтраховымВзносам",
    "Catalog_УдалитьОснованияВыслугиЛет",
    "Catalog_УдалитьОснованияДосрочногоНазначенияПенсии",
    "Catalog_УдалитьОснованияИсчисляемогоСтраховогоСтажа",
    "Catalog_УдалитьОсобыеУсловияТруда",
    "Catalog_УдалитьПараметрыИсчисляемогоСтраховогоСтажа",
    "Catalog_УдалитьПараметрыИсчисляемогоСтраховогоСтажа2014",
    "Catalog_УдалитьСпособыОтраженияЗарплатыВРеглУчете",
    "Catalog_УдалитьТерриториальныеУсловия",
    "Catalog_УдалитьТерриториальныеУсловияПФР",
    "Catalog_УчетныеЗаписиЭлектроннойПочты",
    "Catalog_uzbled_КлассификаторСтанций",
  ];

  private static readonly ALL_REGISTERS = [
    "InformationRegister_ГрафикиРаботыПоВидамВремени",
    "AccumulationRegister_НДСРеестрВходящихСчетовФактур",
    "InformationRegister_ЖурналУчетаСчетовФактур",
    "InformationRegister_ПлановыеНачисления",
    "AccumulationRegister_НДСПредъявленный",
    "AccumulationRegister_НДСЗаписиКнигиПродаж",
    "AccumulationRegister_НДСРеестрИсходящихСчетовФактур",
    "AccumulationRegister_ОСНДоходы",
    "AccumulationRegister_ЗарплатаКВыплате",
    "AccumulationRegister_ВзаиморасчетыССотрудниками",
    "AccumulationRegister_РасчетыНалогоплательщиковСБюджетомПоНДФЛ",
    "AccumulationRegister_ПлатежиВБюджет",
    "InformationRegister_КадроваяИсторияСотрудников",
    "InformationRegister_ДанныеСостоянийСотрудников",
    "InformationRegister_ОплаченныеВедомостиПоЗарплате",
    "AccumulationRegister_РасчетыНалоговыхАгентовСБюджетомПоНДФЛ",
    "InformationRegister_ОплатаВедомостейНаВыплатуЗарплаты",
    "InformationRegister_ГрафикРаботыСотрудников",
    "AccumulationRegister_СведенияОДоходахНДФЛ",
    "InformationRegister_НеявкиСотрудников",
    "InformationRegister_НДФЛУчетРабочихМест",
    "AccumulationRegister_СведенияОДоходахСтраховыеВзносы",
    "AccumulationRegister_НачисленияУдержанияПоСотрудникам",
    "InformationRegister_ПлановыеУдержания",
    "AccumulationRegister_ОтработанноеВремяПоСотрудникам",
    "InformationRegister_ПлановыеАвансы",
    "AccumulationRegister_ОСНПрочиеДоходы",
    "AccumulationRegister_РасчетыСФондамиПоСтраховымВзносам",
    "AccumulationRegister_ИсчисленныеСтраховыеВзносы",
    "AccumulationRegister_ДанныеТабельногоУчетаРабочегоВремениСотрудников",
    "AccumulationRegister_СтраховыеВзносыПоФизическимЛицам",
    "AccumulationRegister_НачислениеАмортизацииОСНУ",
    "InformationRegister_СпособыОтраженияРасходовПоАмортизацииОСБухгалтерскийУчет",
    "InformationRegister_ПервоначальныеСведенияОСНалоговыйУчет",
    "InformationRegister_НачислениеАмортизацииОСНалоговыйУчет",
    "InformationRegister_СчетаБухгалтерскогоУчетаОС",
    "InformationRegister_СостоянияОСОрганизаций",
    "InformationRegister_ПредоставленныеОтпускаПоОтработаннымПериодам",
    "InformationRegister_ПараметрыАмортизацииОСБухгалтерскийУчет",
    "InformationRegister_МестонахождениеОСБухгалтерскийУчет",
    "InformationRegister_НачислениеАмортизацииОСБухгалтерскийУчет",
    "InformationRegister_ПервоначальныеСведенияОСБухгалтерскийУчет",
    "InformationRegister_ПериодыДляРезервовОтпусков",
    "InformationRegister_СобытияОСОрганизаций",
    "InformationRegister_ПараметрыАмортизацииОСНалоговыйУчет",
    "InformationRegister_НачислениеАмортизацииОССпециальныйКоэффициентНалоговыйУчет",
    "InformationRegister_РасчетСписанияРБП",
    "AccumulationRegister_ДанныеОВыплатеДивидендов",
    "AccumulationRegister_ПособияПоСоциальномуСтрахованию",
    "AccumulationRegister_СведенияОНачисленияПоДивидендам",
    "AccumulationRegister_РеализацияУслуг",
    "InformationRegister_СостоянияНМАОрганизаций",
    "InformationRegister_ПервоначальныеСведенияНМАБухгалтерскийУчет",
    "InformationRegister_НачислениеАмортизацииНМАСпециальныйКоэффициентНалоговыйУчет",
    "InformationRegister_УсловияУдержанияПоИсполнительномуДокументу",
    "InformationRegister_СчетаБухгалтерскогоУчетаНМА",
    "InformationRegister_МестонахождениеНМАБухгалтерскийУчет",
    "InformationRegister_ПервоначальныеСведенияНМАНалоговыйУчет",
    "InformationRegister_СпособыОтраженияРасходовПоАмортизацииНМАБухгалтерскийУчет",
    "AccumulationRegister_РеализованныеТоварыКомитентов",
  ];

  // ── Orchestrator ─────────────────────────────────────────────

  async syncAll(): Promise<SyncReport> {
    const startedAt = new Date();
    const results: SyncResult[] = [];
    let aborted = false;

    const run = async (fn: () => Promise<SyncResult>): Promise<void> => {
      if (aborted) return;
      try {
        const result = await fn();
        results.push(result);
        console.log(
          `[1C-Sync] ${result.entity}: fetched=${result.fetched} upserted=${result.upserted} errors=${result.errors}`,
        );
      } catch (err: any) {
        if (isNetworkError(err)) {
          console.warn(`[1C-Sync] Network error — aborting sync cycle: ${err.message}`);
          aborted = true;
          return;
        }
        console.error(`[1C-Sync] Unexpected error:`, err.message);
        results.push({ entity: "unknown", fetched: 0, upserted: 0, errors: 1 });
      }
    };

    // Phase 1: Core Catalogs (FK resolution)
    console.log("[1C-Sync] ═══ Phase 1: Core Catalogs ═══");
    await run(() => this.syncContractors());
    await run(() => this.syncPersons());
    await run(() => this.syncCashFlowArticles());

    // Phase 1b: Extended Catalogs
    if (!aborted) console.log("[1C-Sync] ═══ Phase 1b: Extended Catalogs ═══");
    await run(() => this.syncOrganizations());
    await run(() => this.syncNomenclature());
    await run(() => this.syncBankAccounts());
    await run(() => this.syncContracts());
    await run(() => this.syncOneCEmployees());
    await run(() => this.syncPositions());
    await run(() => this.syncFixedAssets());
    await run(() => this.syncWarehouses());
    await run(() => this.syncCurrencies());
    await run(() => this.syncDepartments());

    // Phase 2: Finance documents (existing)
    if (!aborted) console.log("[1C-Sync] ═══ Phase 2: Finance Documents ═══");
    await run(() => this.syncFinanceDoc("Document_ПриходныйКассовыйОрдер", "ПКО (Cash In)", "CASH", 1));
    await run(() => this.syncFinanceDoc("Document_РасходныйКассовыйОрдер", "РКО (Cash Out)", "CASH", -1));
    await run(() => this.syncFinanceDoc("Document_ПоступлениеНаРасчетныйСчет", "Bank In", "BANK", 1));
    await run(() => this.syncFinanceDoc("Document_СписаниеСРасчетногоСчета", "Bank Out", "BANK", -1));

    // Phase 3: Invoices (existing)
    if (!aborted) console.log("[1C-Sync] ═══ Phase 3: Invoices ═══");
    await run(() => this.syncInvoiceDoc("Document_ПоступлениеТоваровУслуг", "Incoming Goods", "INCOMING"));
    await run(() => this.syncInvoiceDoc("Document_РеализацияТоваровУслуг", "Outgoing Goods", "OUTGOING"));
    await run(() =>
      this.syncInvoiceDoc("Document_ОказаниеУслуг", "Outgoing Services", "OUTGOING", {
        contractorRefExtractor: (row) => row.Контрагенты?.[0]?.Контрагент_Key ?? null,
        totalAmountExtractor: (row) => parseFloat(row.СуммаДокумента) || 0,
        commentExtractor: (row) => row.Комментарий ?? null,
        operationTypeExtractor: (row) => row.ВидВзаиморасчетов ?? row.ВидОперации ?? null,
      })
    );

    // Phase 4: Extended finance documents
    if (!aborted) console.log("[1C-Sync] ═══ Phase 4: Extended Finance Documents ═══");
    await run(() => this.syncAccountingEntries());
    await run(() => this.syncDebtCorrections());
    await run(() => this.syncReceivedInvoices());
    await run(() => this.syncIssuedInvoices());
    await run(() => this.syncAdvanceReports());
    await run(() => this.syncCustomerInvoices());
    await run(() => this.syncContractorSettlements());
    await run(() => this.syncPenaltyCharges());
    await run(() => this.syncDividends());
    await run(() => this.syncRegOperations());
    await run(() => this.syncPaymentOrder());
    await run(() => this.syncInitialBalances());
    await run(() => this.syncRegReports());
    await run(() => this.syncWarrant());

    // Phase 5: Warehousing / inventory documents
    if (!aborted) console.log("[1C-Sync] ═══ Phase 5: Warehouse Documents ═══");
    await run(() => this.syncGoodsWriteOff());
    await run(() => this.syncInventoryCheck());
    await run(() => this.syncDemandInvoice());
    await run(() => this.syncGoodsTransfer());
    await run(() => this.syncNomenclatureAssembly());
    await run(() => this.syncFixedAssetAcceptance());
    await run(() => this.syncAdditionalExpenses());
    await run(() => this.syncRetailSalesReport());
    await run(() => this.syncMaterialTransfer());
    await run(() => this.syncMaterialWriteOff());
    await run(() => this.syncWaybill());

    // Phase 6: HR documents
    if (!aborted) console.log("[1C-Sync] ═══ Phase 6: HR Documents ═══");
    await run(() => this.syncHiring());
    await run(() => this.syncDismissal());
    await run(() => this.syncTransfer());
    await run(() => this.syncVacation());
    await run(() => this.syncSickLeave());
    await run(() => this.syncAbsence());
    await run(() => this.syncBusinessTrip());
    await run(() => this.syncGPHContract());
    await run(() => this.syncGPHAct());
    await run(() => this.syncExecutionList());
    await run(() => this.syncTimesheet());

    // Phase 7: Payroll documents
    if (!aborted) console.log("[1C-Sync] ═══ Phase 7: Payroll Documents ═══");
    await run(() => this.syncPayrollAccrual());
    await run(() => this.syncPayrollBankStatement());
    await run(() => this.syncPayrollCashStatement());
    await run(() => this.syncNDFLWithholding());
    await run(() => this.syncPlannedAccrual());
    await run(() => this.syncPlannedDeduction());
    await run(() => this.syncPlannedAccrualCancellation());

    // Phase 8: Universal catalogs (79 missing → OneCCatalog)
    if (!aborted) console.log("[1C-Sync] ═══ Phase 8: Universal Catalogs (79) ═══");
    for (const cat of OneCSyncService.MISSING_CATALOGS) {
      await run(() => this.syncUniversalCatalog(cat));
    }

    // Phase 9: All registers (60 → OneCRegister)
    if (!aborted) console.log("[1C-Sync] ═══ Phase 9: Registers (60) ═══");
    for (const reg of OneCSyncService.ALL_REGISTERS) {
      await run(() => this.syncUniversalRegister(reg));
    }

    // Phase 10: Recalculate balance snapshots
    if (!aborted) console.log("[1C-Sync] ═══ Phase 10: Balance Snapshots ═══");
    await run(() => this.syncBalanceSnapshots());

    const finishedAt = new Date();
    const report: SyncReport = { startedAt, finishedAt, results, aborted };

    const durationMs = finishedAt.getTime() - startedAt.getTime();
    console.log(
      `[1C-Sync] ═══ Completed in ${(durationMs / 1000).toFixed(1)}s — ` +
        `${results.length} stages, aborted=${aborted} ═══`,
    );

    return report;
  }

  // ── Scheduling ───────────────────────────────────────────────

  startSchedule(): void {
    const schedule = config.oneCCronSchedule;
    console.log(`[1C-Sync] Starting cron schedule: ${schedule}`);

    cron.schedule(schedule, async () => {
      console.log(`[1C-Sync] Cron triggered at ${new Date().toISOString()}`);
      try {
        await this.syncAll();
      } catch (err) {
        console.error("[1C-Sync] Top-level sync error:", (err as Error).message);
      }
    });
  }

  async runOnce(): Promise<SyncReport> {
    console.log("[1C-Sync] Running one-shot sync...");
    return this.syncAll();
  }
}

// ── Singleton export ───────────────────────────────────────────

export const oneCSyncService = new OneCSyncService();
