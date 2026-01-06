"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const constants_1 = require("../constants");
/**
 * Глобальный обработчик ошибок
 * Централизованная обработка всех ошибок приложения
 */
const errorHandler = (err, req, res, _next) => {
    // Логируем ошибку с контекстом запроса
    (0, errors_1.logError)(err, {
        method: req.method,
        path: req.path,
        userId: req.user?.id,
        body: req.method !== 'GET' ? req.body : undefined,
    });
    // Обработка Zod ошибок валидации
    if (err instanceof zod_1.ZodError) {
        const validationError = new errors_1.ValidationError(constants_1.MESSAGES.VALIDATION_ERROR, err.flatten().fieldErrors);
        return res.status(validationError.statusCode).json(validationError.toJSON());
    }
    // Обработка операционных ошибок приложения
    if ((0, errors_1.isOperationalError)(err)) {
        return res.status(err.statusCode).json(err.toJSON());
    }
    // Обработка Prisma ошибок
    if (err?.code?.startsWith?.('P')) {
        const prismaError = (0, errors_1.handlePrismaError)(err);
        return res.status(prismaError.statusCode).json(prismaError.toJSON());
    }
    // Обработка JWT ошибок
    if (err?.name === 'JsonWebTokenError') {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            error: {
                code: 'INVALID_TOKEN',
                message: 'Недействительный токен авторизации',
            },
        });
    }
    if (err?.name === 'TokenExpiredError') {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            error: {
                code: 'TOKEN_EXPIRED',
                message: constants_1.MESSAGES.TOKEN_EXPIRED,
            },
        });
    }
    // Старый формат для обратной совместимости
    if (err?.status && err?.message) {
        return res.status(err.status).json({ message: err.message });
    }
    // Необработанная ошибка - скрываем детали в production
    const isProduction = process.env.NODE_ENV === 'production';
    return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: isProduction ? constants_1.MESSAGES.SERVER_ERROR : err?.message || constants_1.MESSAGES.SERVER_ERROR,
            ...(!isProduction && { stack: err?.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
/**
 * Обработчик для необработанных маршрутов (404)
 */
const notFoundHandler = (req, res) => {
    res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
        error: {
            code: 'NOT_FOUND',
            message: `Маршрут ${req.method} ${req.path} не найден`,
        },
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async wrapper для автоматической обработки ошибок в async route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
