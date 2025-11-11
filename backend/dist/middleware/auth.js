"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const authMiddleware = (req, res, next) => {
    // Allow preflight requests to pass through without authentication
    if (req.method === 'OPTIONS') {
        return next();
    }
    // Try to get token from cookie first
    let token = req.cookies?.auth_token;
    console.log('[AUTH MIDDLEWARE]', {
        path: req.path,
        hasCookie: !!token,
        cookieKeys: Object.keys(req.cookies || {}),
        hasAuthHeader: !!req.headers.authorization
    });
    // Fallback to Authorization header for non-browser clients
    if (!token) {
        const header = req.headers.authorization;
        if (header && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }
    }
    if (!token) {
        console.log('[AUTH MIDDLEWARE] No token found');
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        req.user = payload;
        next();
    }
    catch (error) {
        console.log('[AUTH MIDDLEWARE] Invalid token:', error);
        return res.status(401).json({ message: "Invalid token" });
    }
};
exports.authMiddleware = authMiddleware;
