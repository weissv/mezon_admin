// src/components/children/DocumentPreviewModal.tsx
import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File,
} from 'lucide-react';
import { Document, StudentDocumentCategory } from '../../types/document';
import { Modal } from '../Modal';
import { Button } from '../ui/button';
import {
  isImageFile,
  isPdfFile,
  formatFileSize,
  renderCategoryBadge,
} from './documentUtils';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  document,
}: DocumentPreviewModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!document) return null;

  const rawUrl = document.fileUrl;
  const isDataUrl = rawUrl.startsWith('data:');
  const fullUrl = isDataUrl
    ? rawUrl
    : `${import.meta.env.VITE_API_URL || ''}${rawUrl}`;

  const isImage = isImageFile(rawUrl, document.fileType);
  const isPdf = isPdfFile(rawUrl, document.fileType);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = fullUrl;
    link.download = document.name || 'document';
    if (!isDataUrl) {
      link.target = '_blank';
    }
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetTransform();
        onClose();
      }}
      title={document.name}
      eyebrow="Просмотр документа"
      description="Детальный просмотр, масштаб и скачивание прикрепленного файла."
      meta={
        <div className="flex items-center gap-2">
          {renderCategoryBadge(document.category as StudentDocumentCategory)}
          {document.fileSize ? (
            <span className="text-[12px] text-text-tertiary">
              • {formatFileSize(document.fileSize)}
            </span>
          ) : null}
          {document.issueDate ? (
            <span className="text-[12px] text-text-tertiary">
              • Выдан: {new Date(document.issueDate).toLocaleDateString('ru-RU')}
            </span>
          ) : null}
        </div>
      }
      size="xl"
    >
      <div className="space-y-4">
        {/* Actions bar */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-surface-secondary/60 border border-separator/40">
          <div className="flex items-center gap-1.5">
            {isImage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  title="Увеличить"
                  className="h-8 w-8 p-0"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  title="Уменьшить"
                  className="h-8 w-8 p-0"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotate}
                  title="Повернуть"
                  className="h-8 w-8 p-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <span className="text-[11px] text-text-tertiary ml-1">
                  {Math.round(zoom * 100)}%
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-[13px]"
            >
              <Download className="h-3.5 w-3.5" />
              Скачать
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(fullUrl, '_blank')}
              className="gap-1.5 text-[13px]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              В новой вкладке
            </Button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="relative rounded-xl border border-separator/40 bg-surface-secondary/40 overflow-hidden min-h-[400px] flex items-center justify-center">
          {isImage ? (
            <div className="w-full h-[60vh] overflow-auto flex items-center justify-center p-4 bg-slate-950/5">
              <img
                src={fullUrl}
                alt={document.name}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxHeight: '100%',
                  maxWidth: '100%',
                  objectFit: 'contain',
                }}
                className="rounded shadow-sm"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={fullUrl}
              title={document.name}
              className="w-full h-[65vh] border-0 rounded-lg"
            />
          ) : (
            <div className="py-16 px-6 text-center max-w-md">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-tint-blue flex items-center justify-center text-macos-blue mb-4 shadow-sm">
                <FileText className="h-8 w-8" />
              </div>
              <h4 className="text-[15px] font-semibold text-text-primary mb-1">
                {document.name}
              </h4>
              <p className="text-[13px] text-text-secondary mb-4">
                Прямой предпросмотр для данного типа файла недоступен в браузере. Вы можете скачать файл для просмотра.
              </p>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Скачать файл ({formatFileSize(document.fileSize) || 'документ'})
              </Button>
            </div>
          )}
        </div>

        {/* Notes & details */}
        {document.description && (
          <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-separator/30 text-[13px]">
            <span className="font-medium text-text-primary block mb-0.5">
              Примечание:
            </span>
            <p className="text-text-secondary whitespace-pre-line">
              {document.description}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
