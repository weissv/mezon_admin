"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const AiService_1 = require("./services/AiService");
// Интервал синхронизации Google Drive (30 минут)
const SYNC_INTERVAL_MS = 30 * 60 * 1000;
/**
 * Запускает автоматическую синхронизацию с Google Drive
 */
async function startGoogleDriveSync() {
    console.log("🔄 Starting initial Google Drive sync...");
    try {
        const result = await AiService_1.AiService.syncGoogleDriveDocuments();
        console.log(`✅ Initial sync completed: ${result.synced} synced, ${result.updated} updated, ${result.skipped} skipped, ${result.errors} errors`);
    }
    catch (error) {
        console.error("❌ Initial Google Drive sync failed:", error);
    }
    // Запускаем периодическую синхронизацию
    setInterval(async () => {
        console.log("🔄 Running periodic Google Drive sync...");
        try {
            const result = await AiService_1.AiService.syncGoogleDriveDocuments();
            if (result.synced > 0 || result.updated > 0 || result.errors > 0) {
                console.log(`✅ Periodic sync: ${result.synced} new, ${result.updated} updated, ${result.errors} errors`);
            }
        }
        catch (error) {
            console.error("❌ Periodic Google Drive sync failed:", error);
        }
    }, SYNC_INTERVAL_MS);
}
app_1.default.listen(config_1.config.port, () => {
    console.log(`API running on http://0.0.0.0:${config_1.config.port}`);
    // Запускаем синхронизацию Google Drive через 5 секунд после старта
    // чтобы дать время для инициализации базы данных
    setTimeout(startGoogleDriveSync, 5000);
});
