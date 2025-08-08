// src/config.ts
export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: "12h",
  nodeEnv: process.env.NODE_ENV || "development",
};
