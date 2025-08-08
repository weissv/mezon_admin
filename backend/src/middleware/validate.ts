// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({ body: req.body, query: req.query, params: req.params });
      return next();
    } catch (error) {
      // Возвращаем zod-ошибку как есть, чтобы фронт мог отобразить точные сообщения
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          issues: error.issues,
        });
      }
      return res.status(400).json(error);
    }
  };
