import { TransactionChannel } from "@prisma/client";
import type { SyncContext, SyncResult } from "./sync-context";
import { resolveCounterparty, resolveCashFlowArticleId } from "./resolvers";
import { logger } from "../../../../utils/logger";

/**
 * CRITICAL: Documents use `Posted eq true` to exclude drafts that pollute
 * financial balances. Only posted, non-deleted documents are synced.
 */
const DOCUMENT_FILTER = "DeletionMark eq false and Posted eq true";

async function syncFinanceDoc(
  ctx: SyncContext,
  entity: string,
  label: string,
  channel: TransactionChannel,
  sign: 1 | -1,
): Promise<SyncResult> {
  const rows = await ctx.fetchAll(entity, DOCUMENT_FILTER);

  const { upserted, errors } = await ctx.processInChunks(
    rows as any[],
    `${label} (${entity})`,
    async (r: any) => {
      const rawAmount = parseFloat(r.СуммаДокумента) || 0;
      const amount = rawAmount * sign;
      const date = r.Date ? new Date(r.Date) : new Date();

      const { contractorId, personId } = await resolveCounterparty(
        ctx, r.Контрагент, r.Контрагент_Type,
      );
      const cashFlowArticleId = await resolveCashFlowArticleId(
        ctx, r.СтатьяДвиженияДенежныхСредств_Key,
      );

      const purpose = r.НазначениеПлатежа ?? r.Основание ?? r.Комментарий ?? null;

      await ctx.db.financeTransaction.upsert({
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
    },
  );

  return { entity, fetched: rows.length, upserted, errors };
}

export function financeSyncSteps(ctx: SyncContext) {
  return [
    () => syncFinanceDoc(ctx, "Document_ПриходныйКассовыйОрдер", "ПКО (Cash In)", "CASH", 1),
    () => syncFinanceDoc(ctx, "Document_РасходныйКассовыйОрдер", "РКО (Cash Out)", "CASH", -1),
    () => syncFinanceDoc(ctx, "Document_ПоступлениеНаРасчетныйСчет", "Bank In", "BANK", 1),
    () => syncFinanceDoc(ctx, "Document_СписаниеСРасчетногоСчета", "Bank Out", "BANK", -1),
  ];
}
