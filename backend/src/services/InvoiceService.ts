import { Invoice, InvoiceStatus, Prisma } from "@prisma/client";
import { BaseService, PaginationParams, PaginatedResult } from "./BaseService";
import { NotFoundError, ValidationError } from "../utils/errors";

export interface InvoiceFilters {
  status?: InvoiceStatus;
  groupId?: number;
  childId?: number;
  period?: string;
  search?: string;
}

export interface CreateInvoiceInput {
  childId: number;
  contractId?: number | null;
  amount: number;
  issueDate: string | Date;
  dueDate: string | Date;
  status?: InvoiceStatus;
  period: string;
  description?: string | null;
}

export interface GenerateInvoicesInput {
  period?: string;
  issueDate?: string | Date;
  dueDate?: string | Date;
  groupId?: number;
}

export interface ChildBillingState {
  childId: number;
  balance: number;
  hasDebt: boolean;
}

class InvoiceServiceClass extends BaseService<Invoice, CreateInvoiceInput, any> {
  protected get modelName() {
    return "Счет";
  }

  protected get allowedSortFields() {
    return ["id", "number", "amount", "issueDate", "dueDate", "status", "period", "createdAt"];
  }

  async listInvoices(
    params: PaginationParams & InvoiceFilters
  ): Promise<PaginatedResult<Invoice>> {
    const pagination = this.buildPagination(params);

    const where: Prisma.InvoiceWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.childId) {
      where.childId = params.childId;
    }
    if (params.period) {
      where.period = params.period;
    }
    if (params.groupId) {
      where.child = { groupId: params.groupId };
    }
    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { number: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
        { child: { firstName: { contains: term, mode: "insensitive" } } },
        { child: { lastName: { contains: term, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: "desc" },
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              middleName: true,
              groupId: true,
              group: { select: { id: true, name: true } },
            },
          },
          contract: { select: { id: true, contractNumber: true, monthlyFee: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    // Check and update PENDING invoices past due date to OVERDUE dynamically
    const now = new Date();
    const processedItems = items.map((inv) => {
      if (inv.status === "PENDING" && inv.dueDate && new Date(inv.dueDate) < now) {
        return { ...inv, status: "OVERDUE" as InvoiceStatus };
      }
      return inv;
    });

    return this.formatPaginatedResult(processedItems, total, pagination);
  }

  async createSingleInvoice(data: CreateInvoiceInput): Promise<Invoice> {
    const numericChildId = this.validateNumericId(data.childId, "ID ребенка");

    const child = await this.prisma.child.findUnique({ where: { id: numericChildId } });
    if (!child) throw new NotFoundError("Ребёнок");

    let contractId = data.contractId ? this.validateNumericId(data.contractId, "ID договора") : undefined;
    if (!contractId) {
      const activeContract = await this.prisma.studentContract.findFirst({
        where: { childId: numericChildId, status: "ACTIVE" },
        orderBy: { startDate: "desc" },
      });
      if (activeContract) {
        contractId = activeContract.id;
      }
    }

    const issueDate = this.parseDate(data.issueDate, "дата выставления");
    const dueDate = this.parseDate(data.dueDate, "срок оплаты");

    if (dueDate < issueDate) {
      throw new ValidationError("Срок оплаты не может быть раньше даты выставления");
    }

    // Auto-generate number if not unique format
    const periodClean = data.period.replace("-", "");
    const number = `INV-${periodClean}-${numericChildId}-${Date.now().toString().slice(-4)}`;

    return this.prisma.invoice.create({
      data: {
        childId: numericChildId,
        contractId: contractId || null,
        number,
        amount: data.amount,
        issueDate,
        dueDate,
        status: data.status ?? "PENDING",
        period: data.period,
        description: data.description || null,
      },
      include: {
        child: { select: { id: true, firstName: true, lastName: true } },
        contract: true,
      },
    });
  }

  async generateMonthlyInvoices(data: GenerateInvoicesInput): Promise<{ count: number; invoices: Invoice[] }> {
    const now = new Date();
    const period = data.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const issueDate = data.issueDate ? this.parseDate(data.issueDate, "дата выставления") : now;

    // Default due date: 10th of next month or 10 days from issueDate
    const defaultDueDate = new Date(issueDate);
    defaultDueDate.setDate(defaultDueDate.getDate() + 10);
    const dueDate = data.dueDate ? this.parseDate(data.dueDate, "срок оплаты") : defaultDueDate;

    const activeContracts = await this.prisma.studentContract.findMany({
      where: {
        status: "ACTIVE",
        child: {
          status: "ACTIVE",
          ...(data.groupId ? { groupId: data.groupId } : {}),
        },
      },
      include: {
        child: true,
      },
    });

    const createdInvoices: Invoice[] = [];

    for (const contract of activeContracts) {
      // Check if invoice for this child & period already exists
      const existing = await this.prisma.invoice.findFirst({
        where: {
          childId: contract.childId,
          period,
          status: { not: "CANCELLED" },
        },
      });

      if (!existing) {
        const periodClean = period.replace("-", "");
        const number = `INV-${periodClean}-${contract.childId}`;

        // Ensure unique number
        let finalNumber = number;
        const countExistingNumber = await this.prisma.invoice.count({ where: { number: finalNumber } });
        if (countExistingNumber > 0) {
          finalNumber = `${number}-${Date.now().toString().slice(-4)}`;
        }

        const newInv = await this.prisma.invoice.create({
          data: {
            childId: contract.childId,
            contractId: contract.id,
            number: finalNumber,
            amount: contract.monthlyFee,
            issueDate,
            dueDate,
            status: "PENDING",
            period,
            description: `Оплата за обучение (${period}) по договору №${contract.contractNumber}`,
          },
        });
        createdInvoices.push(newInv);
      }
    }

    return {
      count: createdInvoices.length,
      invoices: createdInvoices,
    };
  }

  async updateStatus(id: number, status: InvoiceStatus): Promise<Invoice> {
    const numericId = this.validateNumericId(id, "ID счета");

    const existing = await this.prisma.invoice.findUnique({ where: { id: numericId } });
    if (!existing) throw new NotFoundError(this.modelName);

    return this.prisma.invoice.update({
      where: { id: numericId },
      data: { status },
      include: {
        child: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async calculateChildrenBillingStates(childIds: number[]): Promise<Map<number, ChildBillingState>> {
    const resultMap = new Map<number, ChildBillingState>();
    if (!childIds.length) return resultMap;

    const now = new Date();

    // 1. Fetch payments per child
    const paymentsGroup = await this.prisma.financeTransaction.groupBy({
      by: ["childId"],
      _sum: { amount: true },
      where: {
        childId: { in: childIds },
        type: "INCOME",
      },
    });

    const paymentsMap = new Map<number, number>();
    paymentsGroup.forEach((g) => {
      if (g.childId) {
        paymentsMap.set(g.childId, Number(g._sum.amount || 0));
      }
    });

    // 2. Fetch invoices for children
    const invoices = await this.prisma.invoice.findMany({
      where: {
        childId: { in: childIds },
        status: { not: "CANCELLED" },
      },
    });

    const invoicesPerChild = new Map<number, Invoice[]>();
    invoices.forEach((inv) => {
      if (inv.childId) {
        const list = invoicesPerChild.get(inv.childId) || [];
        list.push(inv);
        invoicesPerChild.set(inv.childId, list);
      }
    });

    for (const childId of childIds) {
      const paidAmount = paymentsMap.get(childId) || 0;
      const childInvoices = invoicesPerChild.get(childId) || [];

      const invoicedTotal = childInvoices.reduce((acc, inv) => acc + Number(inv.amount || 0), 0);
      const balance = paidAmount - invoicedTotal;

      const hasOverdueInvoice = childInvoices.some(
        (inv) => inv.status === "OVERDUE" || (inv.status === "PENDING" && inv.dueDate && new Date(inv.dueDate) < now)
      );

      const hasDebt = balance < 0 || hasOverdueInvoice;

      resultMap.set(childId, {
        childId,
        balance,
        hasDebt,
      });
    }

    return resultMap;
  }
}

export const InvoiceService = new InvoiceServiceClass();
