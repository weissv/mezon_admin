// src/routes/children.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";
import { buildPagination, buildOrderBy, buildWhere } from "../utils/query";
import { logAction } from "../middleware/actionLogger";import { validate } from "../middleware/validate";
import { createChildSchema, updateChildSchema } from "../schemas/child.schema";
const router = Router();

// GET /api/children
router.get(
  "/",
  checkRole(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]),
  async (req, res) => {
    const { skip, take } = buildPagination(req.query);
    const orderBy = buildOrderBy(req.query);
    const where = buildWhere<any>(req.query, ["status", "groupId", "lastName"]);
    const [items, total] = await Promise.all([
      prisma.child.findMany({ where, skip, take, orderBy, include: { group: true } }),
      prisma.child.count({ where }),
    ]);
    return res.json({ items, total });
  }
);


router.post("/", checkRole(["DEPUTY", "ADMIN"]), validate(createChildSchema), logAction("CREATE_CHILD", (req) => ({ body: req.body })), async (req, res) => {
  const child = await prisma.child.create({ data: req.body });
  return res.status(201).json(child);
});

router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), validate(updateChildSchema), logAction("UPDATE_CHILD", (req) => ({ id: req.params.id, body: req.body })), async (req, res) => {
  const id = Number(req.params.id);
  const child = await prisma.child.update({ where: { id }, data: req.body });
  return res.json(child);
});

export default router;
