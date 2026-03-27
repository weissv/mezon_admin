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

  /**
   * Generic invoice document sync.
   * Invoice docs use Контрагент_Key (direct ref to Catalog_Контрагенты).
   */
  private async syncInvoiceDoc(
    entity: string,
    label: string,
    direction: InvoiceDirection,
  ): Promise<SyncResult> {
    const filter = "DeletionMark eq false";
    const rows = await this.fetchAll(entity, filter);
    let upserted = 0;
    let errors = 0;

    for (const r of rows as any[]) {
      try {
        const contractorId = await this.resolveContractorId(r.Контрагент_Key);
        const totalAmount = parseFloat(r.СуммаДокумента) || 0;

        await this.db.invoice.upsert({
          where: { externalId: r.Ref_Key },
          create: {
            externalId: r.Ref_Key,
            direction,
            documentNumber: r.Number ?? null,
            date: new Date(r.Date),
            posted: r.Posted ?? false,
            operationType: r.ВидОперации ?? null,
            contractorId,
            totalAmount,
            comment: r.Комментарий ?? null,
          },
          update: {
            direction,
            documentNumber: r.Number ?? null,
            date: new Date(r.Date),
            posted: r.Posted ?? false,
            operationType: r.ВидОперации ?? null,
            contractorId,
            totalAmount,
            comment: r.Комментарий ?? null,
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

    // Phase 1: Catalogs (must run before documents for FK resolution)
    console.log("[1C-Sync] ═══ Phase 1: Catalogs ═══");
    await run(() => this.syncContractors());
    await run(() => this.syncPersons());
    await run(() => this.syncCashFlowArticles());

    // Phase 2: Finance documents
    if (!aborted) console.log("[1C-Sync] ═══ Phase 2: Finance Documents ═══");
    await run(() => this.syncFinanceDoc("Document_ПриходныйКассовыйОрдер", "ПКО (Cash In)", "CASH", 1));
    await run(() => this.syncFinanceDoc("Document_РасходныйКассовыйОрдер", "РКО (Cash Out)", "CASH", -1));
    await run(() => this.syncFinanceDoc("Document_ПоступлениеНаРасчетныйСчет", "Bank In", "BANK", 1));
    await run(() => this.syncFinanceDoc("Document_СписаниеСРасчетногоСчета", "Bank Out", "BANK", -1));

    // Phase 3: Invoices
    if (!aborted) console.log("[1C-Sync] ═══ Phase 3: Invoices ═══");
    await run(() => this.syncInvoiceDoc("Document_ПоступлениеТоваровУслуг", "Incoming Goods", "INCOMING"));
    await run(() => this.syncInvoiceDoc("Document_РеализацияТоваровУслуг", "Outgoing Goods", "OUTGOING"));

    // Phase 4: Recalculate balance snapshots
    if (!aborted) console.log("[1C-Sync] ═══ Phase 4: Balance Snapshots ═══");
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
