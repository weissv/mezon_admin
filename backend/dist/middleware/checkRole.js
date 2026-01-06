"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
// Роли с полным доступом ко всем функциям системы
const FULL_ACCESS_ROLES = ["DEVELOPER", "DIRECTOR"];
const checkRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        // DEVELOPER, DIRECTOR, DEPUTY всегда имеют полный доступ
        if (FULL_ACCESS_ROLES.includes(user.role))
            return next();
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};
exports.checkRole = checkRole;
