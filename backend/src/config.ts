// src/config.ts
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://mezon-admin-frontend.onrender.com",
  "https://erp.mezon.uz",
];

const resolveOrigins = () => {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return defaultOrigins;
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: "12h",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: resolveOrigins(),
  // OpenAI API для AI проверки контрольных
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  // Базовый URL для публичных ссылок на контрольные
  publicExamBaseUrl: process.env.PUBLIC_EXAM_BASE_URL || "http://localhost:5173/exam",
};
