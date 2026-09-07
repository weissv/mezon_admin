// Document types
export interface DocumentTemplate {
  id: number;
  name: string;
  content: string;
  createdAt: string;
}

export type StudentDocumentCategory =
  | 'DIPLOMA'
  | 'QUESTIONNAIRE'
  | 'EXPLANATORY'
  | 'MEDICAL'
  | 'IDENTITY'
  | 'CONTRACT'
  | 'APPLICATION'
  | 'OTHER';

export const STUDENT_DOCUMENT_CATEGORY_LABELS: Record<StudentDocumentCategory, string> = {
  DIPLOMA: 'Диплом / Грамота',
  QUESTIONNAIRE: 'Анкета',
  EXPLANATORY: 'Объяснительная',
  MEDICAL: 'Мед. справка',
  IDENTITY: 'Паспорт / Метрика',
  CONTRACT: 'Договор',
  APPLICATION: 'Заявление',
  OTHER: 'Прочее',
};

export interface Document {
  id: number;
  name: string;
  fileUrl: string;
  category?: StudentDocumentCategory | null;
  description?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  issueDate?: string | null;
  templateId: number | null;
  employeeId: number | null;
  childId: number | null;
  createdAt: string;
  updatedAt?: string;
  template?: DocumentTemplate;
  employee?: { id: number; firstName: string; lastName: string };
  child?: { id: number; firstName: string; lastName: string };
}

export interface AttachStudentDocumentInput {
  name: string;
  fileUrl: string;
  category?: StudentDocumentCategory;
  description?: string;
  fileSize?: number;
  fileType?: string;
  issueDate?: string;
}

export interface UpdateStudentDocumentInput {
  name?: string;
  fileUrl?: string;
  category?: StudentDocumentCategory;
  description?: string;
  fileSize?: number;
  fileType?: string;
  issueDate?: string;
}
