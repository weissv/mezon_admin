// src/types/child.ts
// Типы для детей

import { BaseEntity, ChildStatus } from './common';

export interface Group {
  id: number;
  name: string;
  grade?: number | null;
  academicYear?: string | null;
  teacherId?: number | null;
  capacity?: number;
  description?: string | null;
}

export interface Child extends BaseEntity {
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: number;
  group: Group;
  healthInfo?: HealthInfo | null;
  status: ChildStatus;
}

export interface HealthInfo {
  allergies?: string[];
  specialConditions?: string[];
  medications?: string[];
  notes?: string;
}

export interface ChildWithDetails extends Child {
  enrollments?: ClubEnrollmentSummary[];
  attendance?: AttendanceSummary;
  temporaryAbsences?: TemporaryAbsence[];
}

export interface ClubEnrollmentSummary {
  id: number;
  clubId: number;
  clubName: string;
  status: string;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
}

// Временные отсутствия
export interface TemporaryAbsence {
  id: number;
  childId: number;
  startDate: string;
  endDate: string;
  reason?: string | null;
  createdAt: string;
}

export interface CreateTemporaryAbsenceInput {
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateTemporaryAbsenceInput extends Partial<CreateTemporaryAbsenceInput> {}

// Формы
export interface CreateChildInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  groupId: number;
  healthInfo?: string;
}

export interface UpdateChildInput extends Partial<CreateChildInput> {}

// Фильтры
export interface ChildFilters {
  status?: ChildStatus;
  groupId?: number;
  lastName?: string;
}
