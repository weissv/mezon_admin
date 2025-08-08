// src/middleware/checkRole.ts
import { Request, Response, NextFunction } from "express";

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });
    // Директор всегда имеет полный доступ
    if (user.role === "DIRECTOR") return next();
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
