// src/components/children/StudentDocumentsSection.tsx
import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  HardDrive,
  Filter,
  FolderOpen,
  Paperclip,
} from 'lucide-react';
import { Document, StudentDocumentCategory } from '../../types/document';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/Badge';
import {
  useStudentDocuments,
  CategoryFilter,
} from '../../hooks/useStudentDocuments';
import {
  CATEGORY_METADATA,
  formatFileSize,
  renderCategoryBadge,
  isImageFile,
  isPdfFile,
} from './documentUtils';
import { AttachDocumentModal } from './AttachDocumentModal';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface StudentDocumentsSectionProps {
  childId: number;
  childName?: string;
}

const CATEGORY_TABS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'Все' },
  { key: 'DIPLOMA', label: 'Дипломы' },
  { key: 'QUESTIONNAIRE', label: 'Анкеты' },
  { key: 'EXPLANATORY', label: 'Объяснительные' },
  { key: 'MEDICAL', label: 'Мед. справки' },
  { key: 'IDENTITY', label: 'Метрика / Паспорт' },
  { key: 'CONTRACT', label: 'Договоры' },
  { key: 'APPLICATION', label: 'Заявления' },
  { key: 'OTHER', label: 'Прочее' },
];

export function StudentDocumentsSection({
  childId,
  childName,
}: StudentDocumentsSectionProps) {
  const {
    documents,
    allDocuments,
    loading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    categoryCounts,
    deleteDocument,
    refresh,
  } = useStudentDocuments(childId);

  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [deleteConfirmDoc, setDeleteConfirmDoc] = useState<Document | null>(null);

  const handleDownload = (doc: Document) => {
    const rawUrl = doc.fileUrl;
    const isDataUrl = rawUrl.startsWith('data:');
    const fullUrl = isDataUrl
      ? rawUrl
      : `${import.meta.env.VITE_API_URL || ''}${rawUrl}`;

    const link = window.document.createElement('a');
    link.href = fullUrl;
    link.download = doc.name || 'document';
    if (!isDataUrl) {
      link.target = '_blank';
    }
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleDelete = async (doc: Document) => {
    const ok = await deleteDocument(doc.id);
    if (ok) {
      setDeleteConfirmDoc(null);
    }
  };

  return (
    <Card variant="glass" className="overflow-hidden border border-separator/50 shadow-sm">
      <CardHeader className="pb-3 border-b border-separator/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tint-blue flex items-center justify-center text-macos-blue shadow-sm">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-[16px] font-semibold">
                Документы ученика
                <Badge variant="neutral" className="text-[11px] px-2 py-0.5">
                  {categoryCounts.ALL}
                </Badge>
              </CardTitle>
              <p className="text-[12px] text-text-tertiary">
                Дипломы, анкеты, медицинские справки, договоры и объяснительные
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditingDoc(null);
                setIsAttachOpen(true);
              }}
              className="gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Прикрепить документ
            </Button>
          </div>
        </div>

        {/* Categories Tabs & Search Toolbar */}
        <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Scrollable Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
            {CATEGORY_TABS.map((tab) => {
              const count = categoryCounts[tab.key] || 0;
              const isSelected = selectedCategory === tab.key;

              // Hide empty tabs if not ALL or not currently selected
              if (tab.key !== 'ALL' && count === 0 && !isSelected) {
                return null;
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedCategory(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-macos-blue text-white shadow-sm'
                      : 'bg-surface-secondary/70 text-text-secondary hover:bg-surface-secondary hover:text-text-primary border border-separator/30'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-separator/40 text-text-tertiary'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="h-8 pl-8 pr-3 text-[12px] rounded-xl bg-surface-secondary/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-[11px]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="py-12 text-center text-[13px] text-text-tertiary">
            Загрузка документов...
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 px-4 text-center">
            {allDocuments.length === 0 ? (
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-tint-blue/70 mx-auto flex items-center justify-center text-macos-blue">
                  <Paperclip className="h-7 w-7" />
                </div>
                <h3 className="text-[15px] font-semibold text-text-primary">
                  Нет прикрепленных документов
                </h3>
                <p className="text-[13px] text-text-secondary">
                  К профилю ученика пока не прикреплено ни одного документа. Вы можете добавить дипломы, опросники, медсправки или договоры.
                </p>
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingDoc(null);
                      setIsAttachOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Прикрепить первый документ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[14px] text-text-secondary">
                  Документы не найдены по текущему фильтру
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                >
                  Сбросить фильтры
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Bento Grid of Document Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {documents.map((doc) => {
              const meta =
                CATEGORY_METADATA[
                  (doc.category as StudentDocumentCategory) || 'OTHER'
                ] || CATEGORY_METADATA.OTHER;
              const Icon = meta.icon;
              const isImg = isImageFile(doc.fileUrl, doc.fileType);
              const isPdf = isPdfFile(doc.fileUrl, doc.fileType);

              return (
                <div
                  key={doc.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-separator/40 bg-surface-secondary/40 hover:bg-surface-secondary/80 p-4 transition-all duration-200 hover:border-macos-blue/40 hover:shadow-md"
                >
                  {/* Top: Category and file type */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      {renderCategoryBadge(doc.category as StudentDocumentCategory)}
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-secondary text-text-tertiary border border-separator/30">
                        {isPdf ? 'PDF' : isImg ? 'IMG' : 'FILE'}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-tint-blue/60 flex items-center justify-center text-macos-blue shrink-0 mt-0.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          onClick={() => setPreviewDoc(doc)}
                          className="text-[13px] font-semibold text-text-primary group-hover:text-macos-blue cursor-pointer line-clamp-2 transition-colors"
                          title={doc.name}
                        >
                          {doc.name}
                        </h4>
                        {doc.description && (
                          <p className="text-[11px] text-text-secondary line-clamp-2 mt-1">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Meta and actions */}
                  <div className="mt-4 pt-3 border-t border-separator/30 flex items-center justify-between text-[11px] text-text-tertiary">
                    <div className="flex flex-col gap-0.5">
                      {doc.issueDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-text-tertiary" />
                          {new Date(doc.issueDate).toLocaleDateString('ru-RU')}
                        </span>
                      ) : (
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      )}
                      {doc.fileSize ? (
                        <span className="text-[10px] opacity-80">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewDoc(doc)}
                        className="h-7 w-7 p-0 text-text-secondary hover:text-macos-blue"
                        title="Предпросмотр"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="h-7 w-7 p-0 text-text-secondary hover:text-macos-blue"
                        title="Скачать"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingDoc(doc);
                          setIsAttachOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-text-secondary hover:text-macos-blue"
                        title="Редактировать"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmDoc(doc)}
                        className="h-7 w-7 p-0 text-text-secondary hover:text-macos-red"
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Attach / Edit Modal */}
      <AttachDocumentModal
        isOpen={isAttachOpen}
        onClose={() => {
          setIsAttachOpen(false);
          setEditingDoc(null);
        }}
        childId={childId}
        childName={childName}
        editDocument={editingDoc}
        initialCategory={
          selectedCategory !== 'ALL'
            ? (selectedCategory as StudentDocumentCategory)
            : 'OTHER'
        }
        onSuccess={refresh}
      />

      {/* Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface border border-separator/80 p-5 shadow-xl space-y-4">
            <h4 className="text-[15px] font-semibold text-text-primary">
              Удалить документ?
            </h4>
            <p className="text-[13px] text-text-secondary">
              Вы уверены, что хотите удалить «{deleteConfirmDoc.name}»? Это действие нельзя отменить.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmDoc(null)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deleteConfirmDoc)}
              >
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
