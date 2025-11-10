// src/routes/feedback.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// GET /api/feedback - List all feedback (filter by status, type)
router.get("/", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { status, type } = req.query;
  
  const feedback = await prisma.feedback.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(type ? { type: type as any } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  
  return res.json(feedback);
});

// POST /api/feedback - Create new feedback (public endpoint for parents)
router.post("/", async (req, res) => {
  const { parentName, contactInfo, type, message } = req.body;
  
  const feedback = await prisma.feedback.create({
    data: {
      parentName,
      contactInfo,
      type,
      message,
      status: "NEW",
    },
  });
  
  return res.status(201).json(feedback);
});

// PUT /api/feedback/:id - Update feedback status/response
router.put("/:id", checkRole(["DEPUTY", "ADMIN"]), async (req, res) => {
  const { id } = req.params;
  const { status, response } = req.body;
  
  const feedback = await prisma.feedback.update({
    where: { id: Number(id) },
    data: {
      status,
      response: response || null,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
  });
  
  return res.json(feedback);
});

// DELETE /api/feedback/:id - Delete feedback
router.delete("/:id", checkRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  
  await prisma.feedback.delete({
    where: { id: Number(id) },
  });
  
  return res.status(204).send();
});

export default router;
