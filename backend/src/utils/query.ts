// src/utils/query.ts
import { Prisma } from "@prisma/client";

export type ListQuery = {
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
};

export const buildPagination = (q: ListQuery) => {
  const page = Math.max(parseInt(q.page || "1", 10), 1);
  const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 200);
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
};

export const buildOrderBy = (q: ListQuery) => {
  const sortBy = q.sortBy || "id";
  const sortOrder = q.sortOrder === "desc" ? "desc" : "asc";
  return { [sortBy]: sortOrder } as Prisma.Enumerable<any>;
};

// Простой конструктор where из query: eq-поиск по полям
export const buildWhere = <T extends Record<string, any>>(q: ListQuery, allowed: string[]) => {
  const where: Record<string, any> = {};
  for (const key of allowed) {
    const val = q[key];
    if (val !== undefined && val !== "") {
      where[key] = isNaN(Number(val)) ? val : Number(val);
    }
  }
  return where as T;
};
