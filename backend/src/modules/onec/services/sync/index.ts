/**
 * 1C:Enterprise → ERP synchronization orchestrator.
 *
 * Coordinates sync phases: catalogs → finance docs → invoices → documents → HR → payroll
 * → universal catalogs → registers → balance snapshots.
 *
 * Domain-specific sync logic is in sync/ submodules.
 */

import cron from "node-cron";
import { AxiosInstance } from "axios";
import { PrismaClient } from "@prisma/client";

import { config } from "../../../../config";
import { prisma } from "../../../../prisma";
import type { OneCSyncReport as SyncReport, OneCSyncResult as SyncResult } from "../contracts";
import { createOneCClient, isNetworkError } from "../onec-client";
import { SyncContext } from "./sync-context";

import { coreCatalogSteps, extendedCatalogSteps } from "./catalog-sync";
import { financeSyncSteps } from "./finance-sync";
import { invoiceSyncSteps } from "./invoice-sync";
import { extendedFinanceDocSteps, warehouseDocSteps } from "./document-sync";
import { hrSyncSteps } from "./hr-sync";
import { payrollSyncSteps } from "./payroll-sync";
import { universalCatalogSteps, chartEntitySteps, registerSteps, extraRegisterSteps } from "./universal-sync";
import { syncBalanceSnapshots } from "./balance-sync";
import { logger } from "../../../../utils/logger";

interface SyncPhase {
  label: string;
  steps: Array<() => Promise<SyncResult>>;
}

export class OneCSyncService {
  private ctx: SyncContext;

  constructor(client?: AxiosInstance, db?: PrismaClient) {
    this.ctx = new SyncContext(
      client ?? createOneCClient(),
      db ?? prisma,
    );
  }

  private buildSyncPhases(): SyncPhase[] {
    return [
      { label: "Phase 1: Core Catalogs", steps: coreCatalogSteps(this.ctx) },
      { label: "Phase 1b: Extended Catalogs", steps: extendedCatalogSteps(this.ctx) },
      { label: "Phase 2: Finance Documents", steps: financeSyncSteps(this.ctx) },
      { label: "Phase 3: Invoices", steps: invoiceSyncSteps(this.ctx) },
      { label: "Phase 4: Extended Finance Documents", steps: extendedFinanceDocSteps(this.ctx) },
      { label: "Phase 5: Warehouse Documents", steps: warehouseDocSteps(this.ctx) },
      { label: "Phase 6: HR Documents", steps: hrSyncSteps(this.ctx) },
      { label: "Phase 7: Payroll Documents", steps: payrollSyncSteps(this.ctx) },
      { label: "Phase 8: Universal Catalogs", steps: universalCatalogSteps(this.ctx) },
      { label: "Phase 9: Registers", steps: registerSteps(this.ctx) },
      { label: "Phase 10: Charts", steps: chartEntitySteps(this.ctx) },
      { label: "Phase 11: Accounting Register", steps: extraRegisterSteps(this.ctx) },
      { label: "Phase 12: Balance Snapshots", steps: [() => syncBalanceSnapshots(this.ctx)] },
    ];
  }

  async syncAll(): Promise<SyncReport> {
    const startedAt = new Date();
    const results: SyncResult[] = [];
    let aborted = false;
    let abortReason: string | undefined;

    const run = async (fn: () => Promise<SyncResult>): Promise<void> => {
      if (aborted) return;
      try {
        const result = await fn();
        results.push(result);
        logger.info(
          `[1C-Sync] ${result.entity}: fetched=${result.fetched} upserted=${result.upserted} errors=${result.errors}`,
        );
      } catch (err: any) {
        if (isNetworkError(err)) {
          abortReason = err.message;
          logger.warn(`[1C-Sync] Network error — aborting sync cycle: ${abortReason}`);
          aborted = true;
          return;
        }
        logger.error(`[1C-Sync] Unexpected error:`, err.message);
        results.push({ entity: "unknown", fetched: 0, upserted: 0, errors: 1 });
      }
    };

    for (const phase of this.buildSyncPhases()) {
      if (aborted) break;

      logger.info(`[1C-Sync] ═══ ${phase.label} ═══`);
      for (const step of phase.steps) {
        await run(step);
        if (aborted) break;
      }
    }

    const finishedAt = new Date();
    const report: SyncReport = { startedAt, finishedAt, results, aborted, error: abortReason };

    const durationMs = finishedAt.getTime() - startedAt.getTime();
    logger.info(
      `[1C-Sync] ═══ Completed in ${(durationMs / 1000).toFixed(1)}s — ` +
        `${results.length} stages, aborted=${aborted} ═══`,
    );

    return report;
  }

  startSchedule(): void {
    const schedule = config.oneCCronSchedule;
    logger.info(`[1C-Sync] Starting cron schedule: ${schedule}`);

    cron.schedule(schedule, async () => {
      logger.info(`[1C-Sync] Cron triggered at ${new Date().toISOString()}`);
      try {
        await this.syncAll();
      } catch (err) {
        logger.error("[1C-Sync] Top-level sync error:", (err as Error).message);
      }
    });
  }

  async runOnce(): Promise<SyncReport> {
    logger.info("[1C-Sync] Running one-shot sync...");
    return this.syncAll();
  }
}

export const oneCSyncService = new OneCSyncService();
