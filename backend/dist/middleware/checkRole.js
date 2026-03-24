"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRole = void 0;
const constants_1 = require("../constants");
const checkRole = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user)
            return res.status(401).json({ message: "Unauthorized" });
        // DEVELOPER и DIRECTOR имеют полный доступ
        if (constants_1.FULL_ACCESS_ROLES.includes(user.role))
            return next();
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};
exports.checkRole = checkRole;
