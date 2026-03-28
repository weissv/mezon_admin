import { TransactionChannel } from "@prisma/client";
import type { SyncContext, SyncResult } from "./sync-context";
import { resolveCounterparty, resolveCashFlowArticleId } from "./resolvers";
import { logger } from "../../../../utils/logger";

async function syncFinanceDoc(
  ctx: SyncContext,
  entity: string,
  label: string,
  channel: TransactionChannel,
  sign: 1 | -1,
): Promise<SyncResult> {
  const filter = "DeletionMark eq false";
  const rows = await ctx.fetchAll(entity, filter);
  let upserted = 0;
  let errors = 0;

  for (const r of rows as any[]) {
    try {
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
      upserted++;
    } catch (err) {
      errors++;
      logger.error(`[1C-Sync] ${label} upsert error:`, (err as Error).message);
    }
  }

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
