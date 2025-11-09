"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
app_1.default.listen(config_1.config.port, () => {
    console.log(`API running on http://0.0.0.0:${config_1.config.port}`);
});
