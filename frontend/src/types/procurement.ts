// Procurement types
export interface Supplier {
  id: number;
  name: string;
  contactInfo: string;
  pricelist: Record<string, number>;
  createdAt: string;
}

export type PurchaseOrderStatus = 'PENDING' | 'APPROVED' | 'DELIVERED';

export interface PurchaseOrderItem {
  id: number;
  orderId: number;
  ingredientId: number;
  quantity: number;
  price: number;
  ingredient?: { id: number; name: string; unit: string };
}

export interface PurchaseOrder {
  id: number;
  supplierId: number;
  orderDate: string;
  deliveryDate: string | null;
  totalAmount: number;
  status: PurchaseOrderStatus;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}
