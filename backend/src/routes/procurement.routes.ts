// src/routes/procurement.routes.ts
import { Router } from "express";
import { prisma } from "../prisma";
import { checkRole } from "../middleware/checkRole";

const router = Router();

// --- Supplier CRUD ---

// GET /api/procurement/suppliers - List all suppliers
router.get("/suppliers", checkRole(["DEPUTY", "ADMIN", "ACCOUNTANT", "ZAVHOZ"]), async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
  });
  
  return res.json(suppliers);
});

// POST /api/procurement/suppliers - Create new supplier
router.post("/suppliers", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { name, contactInfo, pricelist } = req.body;
  
  const supplier = await prisma.supplier.create({
    data: {
      name,
      contactInfo: contactInfo || null,
      pricelist: pricelist || null,
    },
  });
  
  return res.status(201).json(supplier);
});

// PUT /api/procurement/suppliers/:id - Update supplier
router.put("/suppliers/:id", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  const { name, contactInfo, pricelist } = req.body;
  
  const supplier = await prisma.supplier.update({
    where: { id: Number(id) },
    data: {
      name,
      contactInfo,
      pricelist,
    },
  });
  
  return res.json(supplier);
});

// DELETE /api/procurement/suppliers/:id - Delete supplier
router.delete("/suppliers/:id", checkRole(["ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  
  await prisma.supplier.delete({
    where: { id: Number(id) },
  });
  
  return res.status(204).send();
});

// --- PurchaseOrder CRUD ---

// GET /api/procurement/orders - List all purchase orders
router.get("/orders", checkRole(["DEPUTY", "ADMIN", "ACCOUNTANT", "ZAVHOZ"]), async (req, res) => {
  const { status, supplierId } = req.query;
  
  const orders = await prisma.purchaseOrder.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(supplierId ? { supplierId: Number(supplierId) } : {}),
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        include: {
          ingredient: { select: { id: true, name: true, unit: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  return res.json(orders);
});

// POST /api/procurement/orders - Create new purchase order
router.post("/orders", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { supplierId, orderDate, deliveryDate, items } = req.body;
  
  // Calculate total amount from items
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
  
  const order = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      orderDate: new Date(orderDate),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      totalAmount,
      status: "PENDING",
      items: {
        create: items.map((item: any) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        include: {
          ingredient: { select: { id: true, name: true, unit: true } },
        },
      },
    },
  });
  
  return res.status(201).json(order);
});

// PUT /api/procurement/orders/:id - Update purchase order status
router.put("/orders/:id", checkRole(["DEPUTY", "ADMIN", "ZAVHOZ"]), async (req, res) => {
  const { id } = req.params;
  const { status, deliveryDate } = req.body;
  
  const order = await prisma.purchaseOrder.update({
    where: { id: Number(id) },
    data: {
      status,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: {
        include: {
          ingredient: { select: { id: true, name: true, unit: true } },
        },
      },
    },
  });
  
  return res.json(order);
});

// DELETE /api/procurement/orders/:id - Delete purchase order
router.delete("/orders/:id", checkRole(["ADMIN"]), async (req, res) => {
  const { id } = req.params;
  
  await prisma.purchaseOrder.delete({
    where: { id: Number(id) },
  });
  
  return res.status(204).send();
});

export default router;
