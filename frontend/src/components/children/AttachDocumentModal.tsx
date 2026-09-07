// src/components/children/AttachDocumentModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  File,
  X,
  Loader2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Modal } from '../Modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  StudentDocumentCategory,
  STUDENT_DOCUMENT_CATEGORY_LABELS,
  Document,
} from '../../types/document';
import {
  CATEGORY_METADATA,
  autoDetectCategory,
  cleanFileName,
  formatFileSize,
  isImageFile,
} from './documentUtils';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface AttachDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  childId: number;
  childName?: string;
  onSuccess: () => void;
  initialCategory?: StudentDocumentCategory;
  editDocument?: Document | null;
}

const ALL_CATEGORIES: StudentDocumentCategory[] = [
  'DIPLOMA',
  'QUESTIONNAIRE',
  'EXPLANATORY',
  'MEDICAL',
  'IDENTITY',
  'CONTRACT',
  'APPLICATION',
  'OTHER',
];

export function AttachDocumentModal({
  isOpen,
  onClose,
  childId,
  childName,
  onSuccess,
  initialCategory,
  editDocument,
}: AttachDocumentModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StudentDocumentCategory>('OTHER');
  const [description, setDescription] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (editDocument) {
        setName(editDocument.name);
        setCategory((editDocument.category as StudentDocumentCategory) || 'OTHER');
        setDescription(editDocument.description || '');
        setIssueDate(
          editDocument.issueDate
            ? new Date(editDocument.issueDate).toISOString().split('T')[0]
            : ''
        );
        setFileUrl(editDocument.fileUrl);
        setFileName(editDocument.name);
        setFileSize(editDocument.fileSize || null);
        setFileType(editDocument.fileType || null);
        setAutoDetected(false);
      } else {
        setName('');
        setCategory(initialCategory || 'OTHER');
        setDescription('');
        setIssueDate(new Date().toISOString().split('T')[0]);
        setFileUrl('');
        setFileName('');
        setFileSize(null);
        setFileType(null);
        setPreviewDataUrl(null);
        setAutoDetected(false);
      }
    }
  }, [isOpen, editDocument, initialCategory]);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setAutoDetected(false);

    try {
      const detected = autoDetectCategory(file.name);
      const suggestedName = cleanFileName(file.name);

      // Read small files (< 3MB) as data URL for rock-solid persistence across server container updates
      let finalUrl = '';
      if (file.size <= 3 * 1024 * 1024) {
        finalUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        setPreviewDataUrl(finalUrl);
      } else {
        // Upload larger files via API
        const res = await api.upload('/api/upload', file);
        finalUrl = res.fileUrl;
      }

      setFileUrl(finalUrl);
      setFileName(file.name);
      setFileSize(file.size);
      setFileType(file.type);

      if (!name || name === '') {
        setName(suggestedName);
      }

      if (!editDocument) {
        setCategory(detected);
        if (detected !== 'OTHER') {
          setAutoDetected(true);
        }
      }

      toast.success('Файл успешно выбран');
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error('Ошибка обработки файла', {
        description: err?.message || 'Не удалось прочитать файл',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название документа');
      return;
    }
    if (!fileUrl) {
      toast.error('Пожалуйста, выберите или загрузите файл документа');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editDocument) {
        await api.put(`/api/children/${childId}/documents/${editDocument.id}`, {
          name: name.trim(),
          category,
          description: description.trim() || null,
          issueDate: issueDate || null,
          fileUrl,
          fileSize,
          fileType,
        });
        toast.success('Документ успешно обновлен');
      } else {
        await api.post(`/api/children/${childId}/documents`, {
          name: name.trim(),
          category,
          description: description.trim() || null,
          issueDate: issueDate || null,
          fileUrl,
          fileSize,
          fileType,
        });
        toast.success('Документ успешно прикреплен');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error('Ошибка сохранения документа', {
        description: err?.message || 'Пожалуйста, проверьте введённые данные',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editDocument ? 'Редактировать документ' : 'Прикрепить документ к ученику'}
      eyebrow={childName ? `Ученик: ${childName}` : 'Документооборот'}
      description="Загружайте дипломы, анкеты, медицинские справки, договоры или объяснительные записки."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Upload / Drop zone */}
        {!fileUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition-all duration-200 ${
              isDragOver
                ? 'border-macos-blue bg-tint-blue/20 scale-[0.99]'
                : 'border-separator/80 bg-surface-secondary/40 hover:border-macos-blue/50 hover:bg-surface-secondary/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-macos-blue" />
                <span className="text-[13px] font-medium text-text-primary">
                  Обработка и загрузка файла...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-tint-blue/80 flex items-center justify-center text-macos-blue shadow-sm">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text-primary">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p className="text-[12px] text-text-tertiary mt-1">
                    Поддерживаются PDF, JPG, PNG, DOCX, XLSX (до 15 МБ)
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-separator/60 bg-surface-secondary/70">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-tint-blue flex items-center justify-center text-macos-blue shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="truncate">
                <p className="text-[13px] font-medium text-text-primary truncate">
                  {fileName || name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                  {fileSize && <span>{formatFileSize(fileSize)}</span>}
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Прикреплен
                  </span>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFileUrl('');
                setFileName('');
                setFileSize(null);
                setFileType(null);
                setPreviewDataUrl(null);
              }}
              className="text-text-tertiary hover:text-macos-red h-8 w-8 p-0"
              title="Заменить файл"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Auto-detection badge */}
        {autoDetected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[12px]">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>
              Категория и название определены автоматически по имени файла! Вы можете изменить их при необходимости.
            </span>
          </div>
        )}

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Title */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
              Название документа <span className="text-macos-red">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Диплом олимпиады по математике"
              required
              className="h-10 text-[13px]"
            />
          </div>

          {/* Category selection */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
              Категория документа <span className="text-macos-red">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ALL_CATEGORIES.map((catKey) => {
                const meta = CATEGORY_METADATA[catKey];
                const Icon = meta.icon;
                const isSelected = category === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-macos-blue bg-tint-blue/30 text-macos-blue shadow-sm'
                        : 'border-separator/50 bg-surface-secondary/40 hover:bg-surface-secondary hover:border-separator text-text-secondary'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-macos-blue text-white'
                          : 'bg-surface-secondary text-text-tertiary'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[12px] font-medium truncate">
                      {STUDENT_DOCUMENT_CATEGORY_LABELS[catKey]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-text-tertiary mt-1.5">
              {CATEGORY_METADATA[category]?.description}
            </p>
          </div>

          {/* Issue Date */}
          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
              Дата выдачи / документа
            </label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="h-10 text-[13px]"
            />
          </div>

          {/* Note / Description */}
          <div className="md:col-span-2">
            <label className="block text-[12px] font-medium text-text-secondary mb-1.5">
              Примечание или комментарий
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дополнительные сведения, серия/номер, кем выдан или причина..."
              className="w-full rounded-xl border border-separator/60 bg-surface-secondary/40 px-3.5 py-2.5 text-[13px] text-text-primary placeholder:text-text-tertiary focus:border-macos-blue focus:outline-none focus:ring-2 focus:ring-macos-blue/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-separator/40">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading || !fileUrl}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editDocument ? 'Сохранить изменения' : 'Прикрепить документ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
