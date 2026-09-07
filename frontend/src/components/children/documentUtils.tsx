// src/components/children/documentUtils.tsx
import React from 'react';
import {
  Award,
  FileText,
  FileSignature,
  FileCheck,
  Stethoscope,
  ShieldAlert,
  File,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import {
  StudentDocumentCategory,
  STUDENT_DOCUMENT_CATEGORY_LABELS,
} from '../../types/document';
import { Badge } from '../ui/Badge';

export interface CategoryMeta {
  label: string;
  badgeVariant: 'purple' | 'default' | 'warning' | 'success' | 'glass' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const CATEGORY_METADATA: Record<StudentDocumentCategory, CategoryMeta> = {
  DIPLOMA: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.DIPLOMA,
    badgeVariant: 'purple',
    icon: Award,
    description: 'Дипломы олимпиад, грамоты, сертификаты достижений',
  },
  QUESTIONNAIRE: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.QUESTIONNAIRE,
    badgeVariant: 'glass',
    icon: FileCheck,
    description: 'Анкеты ученика, опросники, психологические карты',
  },
  EXPLANATORY: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.EXPLANATORY,
    badgeVariant: 'warning',
    icon: ShieldAlert,
    description: 'Объяснительные записки, акты, дисциплинарные записи',
  },
  MEDICAL: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.MEDICAL,
    badgeVariant: 'success',
    icon: Stethoscope,
    description: 'Медицинские справки 086/026, освобождения от физкультуры, прививки',
  },
  IDENTITY: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.IDENTITY,
    badgeVariant: 'purple',
    icon: UserCheck,
    description: 'Свидетельство о рождении, метрика, паспорт, ИНПС',
  },
  CONTRACT: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.CONTRACT,
    badgeVariant: 'default',
    icon: FileSignature,
    description: 'Договоры на обучение, доп. соглашения, расписки',
  },
  APPLICATION: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.APPLICATION,
    badgeVariant: 'neutral',
    icon: FileText,
    description: 'Заявления родителей на приём, перевод, отпуск, кружки',
  },
  OTHER: {
    label: STUDENT_DOCUMENT_CATEGORY_LABELS.OTHER,
    badgeVariant: 'neutral',
    icon: File,
    description: 'Прочие документы, сканы и файлы',
  },
};

/**
 * Smart automatic category detection from file name
 */
export function autoDetectCategory(filename: string): StudentDocumentCategory {
  const lower = filename.toLowerCase();

  if (
    lower.includes('диплом') ||
    lower.includes('грамот') ||
    lower.includes('сертифик') ||
    lower.includes('наград') ||
    lower.includes('diploma') ||
    lower.includes('certificate')
  ) {
    return 'DIPLOMA';
  }

  if (
    lower.includes('объясн') ||
    lower.includes('обьясн') ||
    lower.includes('акт') ||
    lower.includes('замечан') ||
    lower.includes('нарушен')
  ) {
    return 'EXPLANATORY';
  }

  if (
    lower.includes('анкет') ||
    lower.includes('опрос') ||
    lower.includes('тестир') ||
    lower.includes('questionnaire')
  ) {
    return 'QUESTIONNAIRE';
  }

  if (
    lower.includes('справк') ||
    lower.includes('мед') ||
    lower.includes('врач') ||
    lower.includes('больнич') ||
    lower.includes('освобожд') ||
    lower.includes('привив') ||
    lower.includes('086') ||
    lower.includes('026')
  ) {
    return 'MEDICAL';
  }

  if (
    lower.includes('паспорт') ||
    lower.includes('метрик') ||
    lower.includes('рождени') ||
    lower.includes('свидетельств') ||
    lower.includes('id_card') ||
    lower.includes('passport')
  ) {
    return 'IDENTITY';
  }

  if (
    lower.includes('договор') ||
    lower.includes('соглашен') ||
    lower.includes('контракт') ||
    lower.includes('contract')
  ) {
    return 'CONTRACT';
  }

  if (
    lower.includes('заявлен') ||
    lower.includes('прошени') ||
    lower.includes('ходатайств') ||
    lower.includes('application')
  ) {
    return 'APPLICATION';
  }

  return 'OTHER';
}

/**
 * Clean up raw filename (remove extension and replace underscores with spaces)
 */
export function cleanFileName(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  return withoutExt.replace(/[_-]+/g, ' ').trim();
}

/**
 * Format bytes into human readable format
 */
export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Check if URL or filename is an image
 */
export function isImageFile(urlOrName: string, fileType?: string | null): boolean {
  if (fileType?.startsWith('image/')) return true;
  if (urlOrName.startsWith('data:image/')) return true;
  const clean = urlOrName.split('?')[0].toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(clean);
}

/**
 * Check if URL or filename is a PDF
 */
export function isPdfFile(urlOrName: string, fileType?: string | null): boolean {
  if (fileType === 'application/pdf') return true;
  if (urlOrName.startsWith('data:application/pdf')) return true;
  const clean = urlOrName.split('?')[0].toLowerCase();
  return clean.endsWith('.pdf');
}

/**
 * Render category badge
 */
export function renderCategoryBadge(category?: StudentDocumentCategory | null) {
  const cat = category || 'OTHER';
  const meta = CATEGORY_METADATA[cat] || CATEGORY_METADATA.OTHER;
  const Icon = meta.icon;

  return (
    <Badge variant={meta.badgeVariant} className="inline-flex items-center gap-1 text-[11px] font-medium">
      <Icon className="h-3 w-3 shrink-0" />
      <span>{meta.label}</span>
    </Badge>
  );
}
