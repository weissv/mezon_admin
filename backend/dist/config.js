"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// src/config.ts
const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://mezon-admin-frontend.onrender.com",
    "https://erp.mezon.uz",
];
const resolveOrigins = () => {
    const raw = process.env.CORS_ORIGINS;
    if (!raw)
        return defaultOrigins;
    return raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};
exports.config = {
    port: parseInt(process.env.PORT || "4000", 10),
    jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
    jwtExpiresIn: "12h",
    nodeEnv: process.env.NODE_ENV || "development",
    corsOrigins: resolveOrigins(),
    // Groq API для AI проверки контрольных
    groqApiKey: process.env.GROQ_API_KEY || "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",
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    groqBlitzModel: process.env.GROQ_BLITZ_MODEL || "llama-3.1-8b-instant",
    groqHeavyModel: process.env.GROQ_HEAVY_MODEL || "openai/gpt-oss-120b",
    // Базовый URL для публичных ссылок на контрольные
    publicExamBaseUrl: process.env.PUBLIC_EXAM_BASE_URL || "http://localhost:5173/exam",
    // 1C OData Integration
    oneCBaseUrl: process.env.ONEC_BASE_URL || "http://100.66.251.128/mezon_db/odata/standard.odata",
    oneCUser: process.env.ONEC_USER || "Главный бухгалтер",
    oneCPassword: process.env.ONEC_PASSWORD || "6653",
    oneCTimeoutMs: parseInt(process.env.ONEC_TIMEOUT_MS || "10000", 10),
    oneCCronSchedule: process.env.ONEC_CRON_SCHEDULE || "*/15 * * * *", // каждые 15 минут
};
