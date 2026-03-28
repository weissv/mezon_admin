import { createHash } from "node:crypto";
import { AxiosInstance } from "axios";
import { PrismaClient } from "@prisma/client";
import type { OneCSyncResult as SyncResult } from "../contracts";

export type { SyncResult };

const PAGE_SIZE = 500;
export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

export class SyncContext {
  constructor(
    public readonly client: AxiosInstance,
    public readonly db: PrismaClient,
  ) {}

  async fetchAll<T = Record<string, unknown>>(
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

  buildRegisterExternalId(registerType: string, row: Record<string, unknown>): string {
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
}
