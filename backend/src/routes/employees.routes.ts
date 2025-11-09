// src/routes/employees.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { buildPagination, buildOrderBy, buildWhere } from "../utils/query";
import bcrypt from "bcryptjs";
import { validate } from "../middleware/validate";
import { createEmployeeSchema, updateEmployeeSchema } from "../schemas/employee.schema";
const router = Router();

router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { skip, take } = buildPagination(req.query);
  const orderBy = buildOrderBy(req.query);
  const where = buildWhere<any>(req.query, ["branchId", "position", "lastName"]);
  const [items, total] = await Promise.all([
    prisma.employee.findMany({ where, skip, take, orderBy, include: { branch: true, user: true } }),
    prisma.employee.count({ where }),
  ]);
  return res.json({ items, total });
});

router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(createEmployeeSchema), async (req, res) => {
  const { body } = req as any;
  const { user, ...employee } = body;
  const created = await prisma.$transaction(async (tx) => {
    const emp = await tx.employee.create({ data: employee });
    let usr = null;
    if (user) {
      usr = await tx.user.create({
        data: {
          email: user.email,
          passwordHash: await (await import("bcryptjs")).hash(user.password, 10),
          role: user.role,
          employeeId: emp.id,
        },
      });
    }
    return { emp, usr };
  });
  return res.status(201).json(created);
});

// TODO: При увольнении (fireDate): деактивировать User, открепить от Club, записать в ActionLog.
router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), validate(updateEmployeeSchema), async (req, res) => {
  const id = Number(req.params.id);
  const updated = await prisma.employee.update({ where: { id }, data: req.body });
  return res.json(updated);
});

export default router;
