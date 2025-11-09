"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    console.error(err);
    if (err?.status && err?.message) {
        return res.status(err.status).json({ message: err.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
};
exports.errorHandler = errorHandler;
