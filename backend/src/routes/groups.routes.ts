// src/routes/groups.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// GET /api/groups
router.get("/", checkRole(["DEPUTY", "ADMIN", "TEACHER", "ACCOUNTANT"]), async (req, res) => {
  const groups = await prisma.group.findMany({
    include: {
      _count: {
        select: { children: true }
      }
    },
    orderBy: { name: 'asc' }
  });
  
  // Сортировка по номеру класса (1 класс, 2 класс, ... 11 класс)
  groups.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
    const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
    return numA - numB;
  });
  
  return res.json(groups);
});

// POST /api/groups - создать класс
router.post("/", checkRole(["ADMIN"]), async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "Название обязательно" });
  }
  
  const group = await prisma.group.create({
    data: { name }
  });
  
  return res.status(201).json(group);
});

// PUT /api/groups/:id - обновить класс
router.put("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  const group = await prisma.group.update({
    where: { id: Number(id) },
    data: { ...(name && { name }) }
  });
  
  return res.json(group);
});

// DELETE /api/groups/:id - удалить класс
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  
  // Проверяем, есть ли дети в этом классе
  const childrenCount = await prisma.child.count({
    where: { groupId: Number(id) }
  });
  
  if (childrenCount > 0) {
    return res.status(400).json({ 
      error: `В этом классе ${childrenCount} детей. Сначала переведите их в другой класс.` 
    });
  }
  
  await prisma.group.delete({
    where: { id: Number(id) }
  });
  
  return res.status(204).send();
});

export default router;
