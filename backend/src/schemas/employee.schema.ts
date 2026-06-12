// src/schemas/employee.schema.ts
import { z } from "zod";

export const employeeContractInputSchema = z.object({
  id: z.number().int().positive().optional(),
  type: z.enum(["MAIN", "PART_TIME", "CONTRACTOR"]),
  number: z.string().min(1, "Номер договора обязателен"),
  date: z.string().datetime("Неверный формат даты"),
  isActive: z.boolean().optional().default(true),
});

export const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, "Имя обязательно"),
    lastName: z.string().min(2, "Фамилия обязательна"),
    middleName: z.string().optional(),
    birthDate: z.string().datetime().nullable().optional(),
    position: z.string().min(2, "Должность обязательна"),
    rate: z.number().positive("Ставка должна быть > 0"),
    hireDate: z.string().datetime("Неверный формат даты"),
    fireDate: z.string().datetime().nullable().optional(),
    hireOrderNumber: z.string().optional(),
    fireOrderNumber: z.string().optional(),
    fireOrderDate: z.string().datetime().nullable().optional(),
    contractEndDate: z.string().datetime().nullable().optional(),
    medicalCheckupDate: z.string().datetime().nullable().optional(),
    attestationDate: z.string().datetime().nullable().optional(),
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
    contracts: z.array(employeeContractInputSchema).optional(),
    subjectIds: z.array(z.number().int().positive()).optional(),
    user: z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["DIRECTOR", "DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]),
      })
      .optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: createEmployeeSchema.shape.body.partial(),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});
