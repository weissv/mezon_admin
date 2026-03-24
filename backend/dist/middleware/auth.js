"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const prisma_1 = require("../prisma");
const authMiddleware = async (req, res, next) => {
    // Allow preflight requests to pass through without authentication
    if (req.method === 'OPTIONS') {
        return next();
    }
    // Try to get token from cookie first
    let token = req.cookies?.auth_token;
    // Fallback to Authorization header for non-browser clients
    if (!token) {
        const header = req.headers.authorization;
        if (header && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }
    }
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        const activeUser = await prisma_1.prisma.user.findFirst({
            where: {
                id: payload.id,
                deletedAt: null,
            },
            select: {
                id: true,
                role: true,
                employeeId: true,
            },
        });
        if (!activeUser) {
            return res.status(401).json({ message: "User account is inactive" });
        }
        req.user = activeUser;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
