// src/types/index.ts
// Экспорт всех типов

// Общие типы
export * from './common';

// Специфичные типы сущностей
export * from './auth';
export * from './child';
export * from './employee';
export * from './lms';

// Re-export для удобства
export type {
  Club,
  ClubEnrollment,
} from './club';

export type {
  Document,
  DocumentTemplate,
} from './document';

export type {
  FinanceTransaction,
} from './finance';

export type {
  InventoryItem,
} from './inventory';

export type {
  MaintenanceRequest,
} from './maintenance';

export type {
  Feedback,
} from './feedback';
