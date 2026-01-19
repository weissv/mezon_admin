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
  // Groq API для AI проверки контрольных
  groqApiKey: process.env.GROQ_API_KEY || "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",
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  // Базовый URL для публичных ссылок на контрольные
  publicExamBaseUrl: process.env.PUBLIC_EXAM_BASE_URL || "http://localhost:5173/exam",
};
