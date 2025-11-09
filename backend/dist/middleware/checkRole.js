"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
const checkRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        // Директор всегда имеет полный доступ
        if (user.role === "DIRECTOR")
            return next();
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};
exports.checkRole = checkRole;
