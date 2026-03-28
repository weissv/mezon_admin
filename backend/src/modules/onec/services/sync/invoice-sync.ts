import { InvoiceDirection } from "@prisma/client";
import type { SyncContext, SyncResult } from "./sync-context";
import { resolveContractorId } from "./resolvers";
import { logger } from "../../../../utils/logger";

interface InvoiceSyncOptions {
  contractorRefExtractor?: (row: any) => string | null;
  totalAmountExtractor?: (row: any) => number;
  commentExtractor?: (row: any) => string | null;
  operationTypeExtractor?: (row: any) => string | null;
}

function extractInvoiceContractorRefKey(row: any): string | null {
  if (row.Контрагент_Key) return row.Контрагент_Key;
  const firstContractor = Array.isArray(row.Контрагенты) ? row.Контрагенты[0] : null;
  if (firstContractor?.Контрагент_Key) return firstContractor.Контрагент_Key;
  return null;
}

async function syncInvoiceDoc(
  ctx: SyncContext,
  entity: string,
  label: string,
  direction: InvoiceDirection,
  options?: InvoiceSyncOptions,
): Promise<SyncResult> {
  const filter = "DeletionMark eq false";
  const rows = await ctx.fetchAll(entity, filter);
  let upserted = 0;
  let errors = 0;

  for (const r of rows as any[]) {
    try {
      const contractorRefKey = options?.contractorRefExtractor
        ? options.contractorRefExtractor(r)
        : extractInvoiceContractorRefKey(r);
      const contractorId = await resolveContractorId(ctx, contractorRefKey);
      const totalAmount = options?.totalAmountExtractor
        ? options.totalAmountExtractor(r)
        : parseFloat(r.СуммаДокумента) || 0;
      const operationType = options?.operationTypeExtractor
        ? options.operationTypeExtractor(r)
        : r.ВидОперации ?? null;
      const comment = options?.commentExtractor
        ? options.commentExtractor(r)
        : r.Комментарий ?? null;

      await ctx.db.invoice.upsert({
        where: { externalId: r.Ref_Key },
        create: {
          externalId: r.Ref_Key,
          direction,
          documentNumber: r.Number ?? null,
          date: r.Date ? new Date(r.Date) : new Date(),
          posted: r.Posted ?? false,
          operationType,
          contractorId,
          totalAmount,
          comment,
        },
        update: {
          direction,
          documentNumber: r.Number ?? null,
          date: r.Date ? new Date(r.Date) : new Date(),
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
      logger.error(`[1C-Sync] ${label} upsert error:`, (err as Error).message);
    }
  }

  return { entity, fetched: rows.length, upserted, errors };
}

export function invoiceSyncSteps(ctx: SyncContext) {
  return [
    () => syncInvoiceDoc(ctx, "Document_ПоступлениеТоваровУслуг", "Incoming Goods", "INCOMING"),
    () => syncInvoiceDoc(ctx, "Document_РеализацияТоваровУслуг", "Outgoing Goods", "OUTGOING"),
    () => syncInvoiceDoc(ctx, "Document_ОказаниеУслуг", "Outgoing Services", "OUTGOING", {
      contractorRefExtractor: (row) => row.Контрагенты?.[0]?.Контрагент_Key ?? null,
      totalAmountExtractor: (row) => parseFloat(row.СуммаДокумента) || 0,
      commentExtractor: (row) => row.Комментарий ?? null,
      operationTypeExtractor: (row) => row.ВидВзаиморасчетов ?? row.ВидОперации ?? null,
    }),
  ];
}
