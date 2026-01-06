// src/services/ChildService.ts
// Сервис для работы с детьми

import { Child, Prisma } from '@prisma/client';
import { BaseService, PaginationParams, SortParams, PaginatedResult } from './BaseService';
import { NotFoundError, ConflictError } from '../utils/errors';

export interface ChildFilters {
  status?: string;
  groupId?: number;
  lastName?: string;
}

export interface CreateChildInput {
  firstName: string;
  lastName: string;
  birthDate: string | Date;
  groupId: number;
  healthInfo?: string;
}

export interface UpdateChildInput extends Partial<CreateChildInput> {}

export interface ChildWithGroup extends Child {
  group: { id: number; name: string };
}

class ChildServiceClass extends BaseService<Child, CreateChildInput, UpdateChildInput> {
  protected get modelName() {
    return 'Ребёнок';
  }

  protected get allowedSortFields() {
    return ['id', 'firstName', 'lastName', 'birthDate', 'status', 'groupId', 'createdAt'];
  }

  /**
   * Получить список детей с фильтрами и пагинацией
   */
  async findMany(
    params: PaginationParams & SortParams & ChildFilters
  ): Promise<PaginatedResult<ChildWithGroup>> {
    const pagination = this.buildPagination(params);
    const orderBy = this.buildOrderBy(params);
    
    const where: Prisma.ChildWhereInput = {};
    
    if (params.status) {
      where.status = params.status as any;
    }
    if (params.groupId) {
      where.groupId = params.groupId;
    }
    if (params.lastName) {
      where.lastName = { contains: params.lastName, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.child.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy,
        include: { group: { select: { id: true, name: true } } },
      }),
      this.prisma.child.count({ where }),
    ]);

    return this.formatPaginatedResult(items as ChildWithGroup[], total, pagination);
  }

  /**
   * Получить ребёнка по ID
   */
  async findById(id: number): Promise<ChildWithGroup> {
    const numericId = this.validateNumericId(id);
    
    const child = await this.prisma.child.findUnique({
      where: { id: numericId },
      include: { group: { select: { id: true, name: true } } },
    });

    if (!child) {
      throw new NotFoundError(this.modelName);
    }

    return child as ChildWithGroup;
  }

  /**
   * Создать ребёнка
   */
  async create(data: CreateChildInput): Promise<Child> {
    // Проверяем существование группы
    const group = await this.prisma.group.findUnique({
      where: { id: data.groupId },
    });
    
    if (!group) {
      throw new NotFoundError('Группа');
    }

    const child = await this.safeQuery(() =>
      this.prisma.child.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: this.parseDate(data.birthDate, 'дата рождения'),
          groupId: data.groupId,
          healthInfo: data.healthInfo ? JSON.parse(data.healthInfo) : undefined,
        },
      })
    );

    // Синхронизируем с LMS
    await this.syncWithLms(child.id, child.groupId);

    return child;
  }

  /**
   * Обновить данные ребёнка
   */
  async update(id: number, data: UpdateChildInput): Promise<Child> {
    const numericId = this.validateNumericId(id);
    
    // Проверяем существование
    await this.findById(numericId);

    // Если меняется группа - проверяем её существование
    if (data.groupId) {
      const group = await this.prisma.group.findUnique({
        where: { id: data.groupId },
      });
      if (!group) {
        throw new NotFoundError('Группа');
      }
    }

    const updateData: Prisma.ChildUpdateInput = {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.birthDate && { birthDate: this.parseDate(data.birthDate, 'дата рождения') }),
      ...(data.groupId && { groupId: data.groupId }),
      ...(data.healthInfo !== undefined && { 
        healthInfo: data.healthInfo ? JSON.parse(data.healthInfo) : null 
      }),
    };

    const child = await this.safeQuery(() =>
      this.prisma.child.update({
        where: { id: numericId },
        data: updateData,
      })
    );

    // Синхронизируем с LMS если изменилась группа
    if (data.groupId) {
      await this.syncWithLms(child.id, child.groupId);
    }

    return child;
  }

  /**
   * Удалить ребёнка
   */
  async delete(id: number): Promise<void> {
    const numericId = this.validateNumericId(id);
    
    // Удаляем связанную запись LMS
    await this.prisma.lmsSchoolStudent.deleteMany({
      where: { studentId: numericId },
    });

    await this.safeQuery(() =>
      this.prisma.child.delete({ where: { id: numericId } })
    );
  }

  /**
   * Синхронизация с LMS
   */
  private async syncWithLms(childId: number, groupId: number): Promise<void> {
    const existingLmsStudent = await this.prisma.lmsSchoolStudent.findFirst({
      where: { studentId: childId },
    });

    if (existingLmsStudent) {
      if (existingLmsStudent.classId !== groupId) {
        await this.prisma.lmsSchoolStudent.update({
          where: { id: existingLmsStudent.id },
          data: { classId: groupId },
        });
      }
    } else {
      await this.prisma.lmsSchoolStudent.create({
        data: {
          studentId: childId,
          classId: groupId,
          status: 'active',
        },
      });
    }
  }

  /**
   * Получить временные отсутствия ребёнка
   */
  async getAbsences(childId: number) {
    const numericId = this.validateNumericId(childId);
    
    return this.prisma.temporaryAbsence.findMany({
      where: { childId: numericId },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Добавить временное отсутствие
   */
  async addAbsence(childId: number, data: { startDate: string; endDate: string; reason?: string }) {
    const numericId = this.validateNumericId(childId);
    
    // Проверяем существование ребёнка
    await this.findById(numericId);

    return this.prisma.temporaryAbsence.create({
      data: {
        childId: numericId,
        startDate: this.parseDate(data.startDate),
        endDate: this.parseDate(data.endDate),
        reason: data.reason,
      },
    });
  }

  /**
   * Обновить отсутствие
   */
  async updateAbsence(absenceId: number, data: { startDate?: string; endDate?: string; reason?: string }) {
    const numericId = this.validateNumericId(absenceId, 'ID отсутствия');
    
    return this.safeQuery(() =>
      this.prisma.temporaryAbsence.update({
        where: { id: numericId },
        data: {
          ...(data.startDate && { startDate: this.parseDate(data.startDate) }),
          ...(data.endDate && { endDate: this.parseDate(data.endDate) }),
          ...(data.reason !== undefined && { reason: data.reason }),
        },
      })
    );
  }

  /**
   * Удалить отсутствие
   */
  async deleteAbsence(absenceId: number): Promise<void> {
    const numericId = this.validateNumericId(absenceId, 'ID отсутствия');
    
    await this.safeQuery(() =>
      this.prisma.temporaryAbsence.delete({ where: { id: numericId } })
    );
  }
}

export const ChildService = new ChildServiceClass();
