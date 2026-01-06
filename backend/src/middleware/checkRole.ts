// src/middleware/checkRole.ts
import { Request, Response, NextFunction } from "express";

// Роли с полным доступом ко всем функциям системы
const FULL_ACCESS_ROLES = ["DEVELOPER", "DIRECTOR"];

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    
    // DEVELOPER, DIRECTOR, DEPUTY всегда имеют полный доступ
    if (FULL_ACCESS_ROLES.includes(user.role)) return next();
    
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
