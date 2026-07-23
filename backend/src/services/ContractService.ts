import { StudentContract, ContractStatus, Prisma } from "@prisma/client";
import { BaseService } from "./BaseService";
import { NotFoundError, ValidationError } from "../utils/errors";

export interface CreateContractInput {
  contractNumber: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  monthlyFee: number;
  status?: ContractStatus;
  fileUrl?: string | null;
}

export interface UpdateContractInput extends Partial<CreateContractInput> {}

class ContractServiceClass extends BaseService<StudentContract, CreateContractInput, UpdateContractInput> {
  protected get modelName() {
    return "Договор ученика";
  }

  protected get allowedSortFields() {
    return ["id", "contractNumber", "startDate", "monthlyFee", "status", "createdAt"];
  }

  async findByChildId(childId: number): Promise<StudentContract[]> {
    const numericChildId = this.validateNumericId(childId, "ID ребенка");

    const child = await this.prisma.child.findUnique({ where: { id: numericChildId } });
    if (!child) throw new NotFoundError("Ребёнок");

    return this.prisma.studentContract.findMany({
      where: { childId: numericChildId },
      orderBy: { startDate: "desc" },
    });
  }

  async findById(id: number): Promise<StudentContract> {
    const numericId = this.validateNumericId(id, "ID договора");

    const contract = await this.prisma.studentContract.findUnique({
      where: { id: numericId },
      include: {
        child: { select: { id: true, firstName: true, lastName: true, groupId: true } },
      },
    });

    if (!contract) throw new NotFoundError(this.modelName);
    return contract;
  }

  async create(childId: number, data: CreateContractInput): Promise<StudentContract> {
    const numericChildId = this.validateNumericId(childId, "ID ребенка");

    const child = await this.prisma.child.findUnique({ where: { id: numericChildId } });
    if (!child) throw new NotFoundError("Ребёнок");

    const existing = await this.prisma.studentContract.findUnique({
      where: { contractNumber: data.contractNumber },
    });
    if (existing) {
      throw new ValidationError(`Договор с номером "${data.contractNumber}" уже существует`);
    }

    const startDate = this.parseDate(data.startDate, "дата начала договора");
    const endDate = data.endDate ? this.parseDate(data.endDate, "дата окончания договора") : null;

    if (endDate && startDate > endDate) {
      throw new ValidationError("Дата начала не может быть позже даты окончания договора");
    }

    return this.prisma.studentContract.create({
      data: {
        childId: numericChildId,
        contractNumber: data.contractNumber,
        startDate,
        endDate,
        monthlyFee: data.monthlyFee,
        status: data.status ?? "ACTIVE",
        fileUrl: data.fileUrl || null,
      },
    });
  }

  async update(id: number, data: UpdateContractInput): Promise<StudentContract> {
    const numericId = this.validateNumericId(id, "ID договора");
    await this.findById(numericId);

    if (data.contractNumber) {
      const existing = await this.prisma.studentContract.findFirst({
        where: { contractNumber: data.contractNumber, id: { not: numericId } },
      });
      if (existing) {
        throw new ValidationError(`Договор с номером "${data.contractNumber}" уже существует`);
      }
    }

    const updateData: Prisma.StudentContractUpdateInput = {};

    if (data.contractNumber !== undefined) updateData.contractNumber = data.contractNumber;
    if (data.monthlyFee !== undefined) updateData.monthlyFee = data.monthlyFee;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl || null;
    if (data.startDate !== undefined) updateData.startDate = this.parseDate(data.startDate, "дата начала");
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? this.parseDate(data.endDate, "дата окончания") : null;
    }

    return this.prisma.studentContract.update({
      where: { id: numericId },
      data: updateData,
    });
  }

  async delete(id: number): Promise<void> {
    const numericId = this.validateNumericId(id, "ID договора");
    await this.findById(numericId);

    await this.prisma.studentContract.delete({ where: { id: numericId } });
  }
}

export const ContractService = new ContractServiceClass();
