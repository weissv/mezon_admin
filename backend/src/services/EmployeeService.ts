// src/services/EmployeeService.ts
// Сервис для работы с сотрудниками

import { Employee, Prisma } from '@prisma/client';
import { BaseService, PaginationParams, SortParams, PaginatedResult } from './BaseService';
import { NotFoundError } from '../utils/errors';
import bcrypt from 'bcryptjs';

export interface EmployeeFilters {
  position?: string;
  lastName?: string;
  hasUser?: boolean;
  search?: string;
  category?: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string | Date;
  position: string;
  rate: number;
  hireDate: string | Date;
  fireDate?: string | Date;
  hireOrderNumber?: string;
  fireOrderNumber?: string;
  fireOrderDate?: string | Date;
  contractEndDate?: string | Date;
  medicalCheckupDate?: string | Date;
  attestationDate?: string | Date;
  status?: string;
  hireOrderFileUrl?: string;
  hireOrderFileName?: string;
  fireOrderFileUrl?: string;
  fireOrderFileName?: string;
  contracts?: { id?: number; type: any; number: string; date: string | Date; isActive?: boolean; documentUrl?: string; documentName?: string }[];
  subjectIds?: number[];
  user?: {
    email: string;
    password: string;
    role: string;
  };
}

export interface UpdateEmployeeInput extends Partial<Omit<CreateEmployeeInput, 'user'>> {}

export interface EmployeeWithUser extends Employee {
  user: { id: number; email: string; role: string } | null;
}

class EmployeeServiceClass extends BaseService<Employee, CreateEmployeeInput, UpdateEmployeeInput> {
  protected get modelName() {
    return 'Сотрудник';
  }

  protected get allowedSortFields() {
    return ['id', 'firstName', 'lastName', 'position', 'hireDate', 'rate', 'createdAt'];
  }

  /**
   * Получить список сотрудников с фильтрами и пагинацией
   */
  async findMany(
    params: PaginationParams & SortParams & EmployeeFilters
  ): Promise<PaginatedResult<EmployeeWithUser>> {
    const pagination = this.buildPagination(params);
    const orderBy = this.buildOrderBy(params);
    
    const where: Prisma.EmployeeWhereInput = {};
    
    if (params.category === 'ARCHIVED') {
      where.status = 'ARCHIVED';
    } else {
      where.status = 'ACTIVE';
    }
    
    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { position: { contains: params.search, mode: 'insensitive' } }
      ];
    } else {
      if (params.position) {
        where.position = { contains: params.position, mode: 'insensitive' };
      }
      if (params.lastName) {
        where.lastName = { contains: params.lastName, mode: 'insensitive' };
      }
    }
    
    if (params.category) {
      if (params.category === 'CONTRACT') {
        where.contracts = { some: { isActive: true, type: { in: ['MAIN', 'PART_TIME'] } } };
      } else if (params.category === 'GPH') {
        where.contracts = { some: { isActive: true, type: 'CONTRACTOR' } };
      } else if (params.category === 'ADMIN') {
        const adminCondition = { OR: [{ user: { role: { in: ['ADMIN', 'DEPUTY', 'DIRECTOR', 'ZAVHOZ'] } } }, { position: { contains: 'директор', mode: 'insensitive' } }, { position: { contains: 'админ', mode: 'insensitive' } }, { position: { contains: 'завуч', mode: 'insensitive' } }, { position: { contains: 'завхоз', mode: 'insensitive' } }, { position: { contains: 'ахо', mode: 'insensitive' } }] };
        where.AND = [adminCondition] as any;
      } else if (params.category === 'TEACHER') {
        const teacherCondition = { OR: [{ user: { role: 'TEACHER' } }, { position: { contains: 'учитель', mode: 'insensitive' } }, { position: { contains: 'педагог', mode: 'insensitive' } }, { position: { contains: 'преподаватель', mode: 'insensitive' } }] };
        where.AND = [teacherCondition] as any;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy,
        include: { 
          user: { 
            select: { id: true, email: true, role: true } 
          },
          contracts: true
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return this.formatPaginatedResult(items as EmployeeWithUser[], total, pagination);
  }

  /**
   * Получить сотрудника по ID
   */
  async findById(id: number): Promise<EmployeeWithUser> {
    const numericId = this.validateNumericId(id);
    
    const employee = await this.prisma.employee.findUnique({
      where: { id: numericId },
      include: { 
        user: { 
          select: { id: true, email: true, role: true } 
        },
        contracts: { orderBy: { date: 'desc' as const } },
        teacherSubjects: { include: { subject: true } } // Subject relation uses teacherSubjects
      },
    });

    if (!employee) {
      throw new NotFoundError(this.modelName);
    }

    return employee as EmployeeWithUser;
  }

  /**
   * Создать сотрудника
   */
  async create(data: CreateEmployeeInput): Promise<{ emp: Employee; usr: any | null }> {
    const { user, ...employeeData } = data;

    return this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.create({
        data: {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          middleName: employeeData.middleName,
          birthDate: employeeData.birthDate ? this.parseDate(employeeData.birthDate) : undefined,
          position: employeeData.position,
          rate: employeeData.rate,
          hireDate: this.parseDate(employeeData.hireDate),
          fireDate: employeeData.fireDate ? this.parseDate(employeeData.fireDate) : undefined,
          hireOrderNumber: employeeData.hireOrderNumber,
          fireOrderNumber: employeeData.fireOrderNumber,
          fireOrderDate: employeeData.fireOrderDate ? this.parseDate(employeeData.fireOrderDate) : undefined,
          contractEndDate: employeeData.contractEndDate ? this.parseDate(employeeData.contractEndDate) : undefined,
          medicalCheckupDate: employeeData.medicalCheckupDate ? this.parseDate(employeeData.medicalCheckupDate) : undefined,
          attestationDate: employeeData.attestationDate ? this.parseDate(employeeData.attestationDate) : undefined,
          status: (employeeData.status as any) || 'ACTIVE',
        },
      });

      // Handle hire/fire order documents
      let hireOrderDocId, fireOrderDocId;
      
      if (employeeData.hireOrderFileUrl) {
        const doc = await tx.document.create({
          data: { name: employeeData.hireOrderFileName || 'Приказ о приёме', fileUrl: employeeData.hireOrderFileUrl, employeeId: emp.id }
        });
        hireOrderDocId = doc.id;
      }
      
      if (employeeData.fireOrderFileUrl) {
        const doc = await tx.document.create({
          data: { name: employeeData.fireOrderFileName || 'Приказ об увольнении', fileUrl: employeeData.fireOrderFileUrl, employeeId: emp.id }
        });
        fireOrderDocId = doc.id;
      }

      if (hireOrderDocId || fireOrderDocId) {
        await tx.employee.update({
          where: { id: emp.id },
          data: { hireOrderDocId, fireOrderDocId }
        });
      }

      // Handle contracts
      if (employeeData.contracts) {
        for (const c of employeeData.contracts) {
          let documentId = undefined;
          if (c.documentUrl) {
            const doc = await tx.document.create({
              data: { name: c.documentName || `Договор №${c.number}`, fileUrl: c.documentUrl, employeeId: emp.id }
            });
            documentId = doc.id;
          }
          await tx.employeeContract.create({
            data: {
              employeeId: emp.id,
              type: c.type,
              number: c.number,
              date: this.parseDate(c.date),
              isActive: c.isActive ?? true,
              documentId
            }
          });
        }
      }

      // Create subject associations if provided
      if (data.subjectIds && data.subjectIds.length > 0) {
        await tx.teacherSubject.createMany({
          data: data.subjectIds.map((subjectId: number) => ({
            employeeId: emp.id,
            subjectId,
            isPrimary: false,
          })),
        });
      }

      let usr = null;
      if (user) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        usr = await tx.user.create({
          data: {
            email: user.email,
            passwordHash,
            role: user.role as any,
            employeeId: emp.id,
          },
        });
      }

      return { emp, usr };
    });
  }

  /**
   * Обновить данные сотрудника
   */
  async update(id: number, data: UpdateEmployeeInput): Promise<Employee> {
    const numericId = this.validateNumericId(id);
    
    // Проверяем существование
    await this.findById(numericId);

    const updateData: Prisma.EmployeeUpdateInput = {};
    
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.middleName !== undefined) updateData.middleName = data.middleName;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? this.parseDate(data.birthDate) : null;
    if (data.position) updateData.position = data.position;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.hireDate) updateData.hireDate = this.parseDate(data.hireDate);
    if (data.fireDate !== undefined) updateData.fireDate = data.fireDate ? this.parseDate(data.fireDate) : null;
    if (data.hireOrderNumber !== undefined) updateData.hireOrderNumber = data.hireOrderNumber || null;
    if (data.fireOrderNumber !== undefined) updateData.fireOrderNumber = data.fireOrderNumber || null;
    if (data.fireOrderDate !== undefined) updateData.fireOrderDate = data.fireOrderDate ? this.parseDate(data.fireOrderDate) : null;
    if (data.contractEndDate !== undefined) updateData.contractEndDate = data.contractEndDate ? this.parseDate(data.contractEndDate) : null;
    if (data.medicalCheckupDate !== undefined) updateData.medicalCheckupDate = data.medicalCheckupDate ? this.parseDate(data.medicalCheckupDate) : null;
    if (data.attestationDate !== undefined) updateData.attestationDate = data.attestationDate ? this.parseDate(data.attestationDate) : null;
    if (data.status !== undefined) updateData.status = data.status as any;

    // Handle documents updates
    if (data.hireOrderFileUrl) {
      const doc = await this.prisma.document.create({
        data: { name: data.hireOrderFileName || 'Приказ о приёме', fileUrl: data.hireOrderFileUrl, employeeId: numericId }
      });
      updateData.hireOrderDocId = doc.id;
    }
    
    if (data.fireOrderFileUrl) {
      const doc = await this.prisma.document.create({
        data: { name: data.fireOrderFileName || 'Приказ об увольнении', fileUrl: data.fireOrderFileUrl, employeeId: numericId }
      });
      updateData.fireOrderDocId = doc.id;
    }

    if (data.contracts !== undefined) {
      const currentContractIds = data.contracts.filter(c => c.id).map(c => c.id as number);
      await this.prisma.employeeContract.deleteMany({
        where: { employeeId: numericId, id: { notIn: currentContractIds } }
      });
      
      for (const contract of data.contracts) {
        let documentId = undefined;
        if (contract.documentUrl) {
          const doc = await this.prisma.document.create({
            data: { name: contract.documentName || `Договор №${contract.number}`, fileUrl: contract.documentUrl, employeeId: numericId }
          });
          documentId = doc.id;
        }

        if (contract.id) {
          await this.prisma.employeeContract.update({
            where: { id: contract.id },
            data: {
              type: contract.type,
              number: contract.number,
              date: this.parseDate(contract.date),
              isActive: contract.isActive,
              ...(documentId ? { documentId } : {})
            }
          });
        } else {
          await this.prisma.employeeContract.create({
            data: {
              employeeId: numericId,
              type: contract.type,
              number: contract.number,
              date: this.parseDate(contract.date),
              isActive: contract.isActive ?? true,
              documentId
            }
          });
        }
      }
    }

    if (data.subjectIds !== undefined) {
      await this.prisma.teacherSubject.deleteMany({
        where: { employeeId: numericId }
      });
        if (data.subjectIds.length > 0) {
          await this.prisma.teacherSubject.createMany({
            data: data.subjectIds.map((subjectId: number) => ({
              employeeId: numericId,
              subjectId,
              isPrimary: false,
            })),
          });
        }
    }

    return this.safeQuery(() =>
      this.prisma.employee.update({
        where: { id: numericId },
        data: updateData,
        include: { contracts: true }
      })
    );
  }

  /**
   * Удалить сотрудника
   */
  async delete(id: number): Promise<void> {
    const numericId = this.validateNumericId(id);
    
    // Удаляем связанного пользователя
    await this.prisma.user.deleteMany({
      where: { employeeId: numericId },
    });

    await this.safeQuery(() =>
      this.prisma.employee.delete({ where: { id: numericId } })
    );
  }

  /**
   * Получить напоминания о медосмотрах и аттестациях
   */
  async getReminders(daysAhead: number = 30) {
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

    const [medicalCheckups, attestations] = await Promise.all([
      this.prisma.employee.findMany({
        where: {
          fireDate: null,
          medicalCheckupDate: { lte: futureDate },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          medicalCheckupDate: true,
        },
        orderBy: { medicalCheckupDate: 'asc' },
      }),
      this.prisma.employee.findMany({
        where: {
          fireDate: null,
          attestationDate: { lte: futureDate },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          attestationDate: true,
        },
        orderBy: { attestationDate: 'asc' },
      }),
    ]);

    const calcDaysUntil = (date: Date) => 
      Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    return {
      medicalCheckups: medicalCheckups.map((e) => ({
        ...e,
        daysUntil: calcDaysUntil(e.medicalCheckupDate!),
      })),
      attestations: attestations.map((e) => ({
        ...e,
        daysUntil: calcDaysUntil(e.attestationDate!),
      })),
    };
  }

  /**
   * Получить всех учителей (для выбора в формах)
   */
  async getTeachers() {
    return this.prisma.employee.findMany({
      where: {
        fireDate: null,
        user: {
          role: { in: ['TEACHER', 'DIRECTOR', 'DEPUTY'] },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
      },
      orderBy: { lastName: 'asc' },
    });
  }
}

export const EmployeeService = new EmployeeServiceClass();
