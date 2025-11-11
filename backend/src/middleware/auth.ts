// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";

export interface AuthUser {
  id: number;
  role: string;
  employeeId: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = payload;
    next();
  } catch (error) {
    console.log('[AUTH MIDDLEWARE] Invalid token:', error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
