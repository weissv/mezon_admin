"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({ body: req.body, query: req.query, params: req.params });
        return next();
    }
    catch (error) {
        // Возвращаем zod-ошибку как есть, чтобы фронт мог отобразить точные сообщения
        if (error instanceof zod_1.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                issues: error.issues,
            });
        }
        return res.status(400).json(error);
    }
};
exports.validate = validate;
