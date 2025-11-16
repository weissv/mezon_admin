"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.csvTextToRecords = csvTextToRecords;
const sync_1 = require("csv-parse/sync");
/**
 * Converts CSV text (with headers) into an array of objects using csv-parse.
 * Keeps formatting minimal so callers can map headers the way they need.
 */
function csvTextToRecords(csvText) {
    if (!csvText.trim()) {
        return [];
    }
    return (0, sync_1.parse)(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
}
