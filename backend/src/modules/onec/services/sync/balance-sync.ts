import type { SyncContext, SyncResult } from "./sync-context";
import { logger } from "../../../../utils/logger";

export async function syncBalanceSnapshots(ctx: SyncContext): Promise<SyncResult> {
  const entity = "BalanceSnapshot (calculated)";
  const now = new Date();
  let upserted = 0;
  let errors = 0;

  try {
    const cashAgg = await ctx.db.financeTransaction.aggregate({
      where: { channel: "CASH" },
      _sum: { amount: true },
    });
    await ctx.db.balanceSnapshot.create({
      data: {
        snapshotDate: now,
        balanceType: "CASH",
        amount: cashAgg._sum.amount ?? 0,
        label: "Касса",
      },
    });
    upserted++;

    const bankAgg = await ctx.db.financeTransaction.aggregate({
      where: { channel: "BANK" },
      _sum: { amount: true },
    });
    await ctx.db.balanceSnapshot.create({
      data: {
        snapshotDate: now,
        balanceType: "BANK",
        amount: bankAgg._sum.amount ?? 0,
        label: "Расчётный счёт",
      },
    });
    upserted++;

    const contractorDebts: { contractorId: number; _sum: { amount: number | null } }[] =
      await ctx.db.financeTransaction.groupBy({
        by: ["contractorId"],
        where: { contractorId: { not: null } },
        _sum: { amount: true },
      }) as any;

    for (const row of contractorDebts) {
      if (!row.contractorId) continue;
      try {
        const contractor = await ctx.db.contractor.findUnique({
          where: { id: row.contractorId },
          select: { name: true },
        });
        await ctx.db.balanceSnapshot.create({
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
        logger.error(`[1C-Sync] BalanceSnapshot contractor debt error:`, (err as Error).message);
      }
    }
  } catch (err) {
    errors++;
    console.error(`[1C-Sync] BalanceSnapshot aggregate error:`, (err as Error).message);
  }

  return { entity, fetched: 0, upserted, errors };
}
