"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// src/config.ts
exports.config = {
    port: parseInt(process.env.PORT || "4000", 10),
    jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
    jwtExpiresIn: "12h",
    nodeEnv: process.env.NODE_ENV || "development",
};
