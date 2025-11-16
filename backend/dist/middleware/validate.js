"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => async (req, res, next) => {
    try {
        const parsed = await schema.parseAsync({ body: req.body, query: req.query, params: req.params });
        // Persist sanitized values back onto the request so downstream handlers receive coerced data.
        if (parsed.body)
            req.body = parsed.body;
        if (parsed.query)
            req.query = parsed.query;
        if (parsed.params)
            req.params = parsed.params;
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
