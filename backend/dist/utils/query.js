"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWhere = exports.buildOrderBy = exports.buildPagination = void 0;
const buildPagination = (q) => {
    const page = Math.max(parseInt(q.page || "1", 10), 1);
    const pageSize = Math.min(Math.max(parseInt(q.pageSize || "20", 10), 1), 200);
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    return { page, pageSize, skip, take };
};
exports.buildPagination = buildPagination;
const buildOrderBy = (q) => {
    const sortBy = q.sortBy || "id";
    const sortOrder = q.sortOrder === "desc" ? "desc" : "asc";
    return { [sortBy]: sortOrder };
};
exports.buildOrderBy = buildOrderBy;
// Простой конструктор where из query: eq-поиск по полям
const buildWhere = (q, allowed) => {
    const where = {};
    for (const key of allowed) {
        const val = q[key];
        if (val !== undefined && val !== "") {
            where[key] = isNaN(Number(val)) ? val : Number(val);
        }
    }
    return where;
};
exports.buildWhere = buildWhere;
