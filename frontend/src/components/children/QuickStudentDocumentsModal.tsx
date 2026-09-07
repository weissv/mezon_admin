// src/components/children/QuickStudentDocumentsModal.tsx
import React, { useState } from 'react';
import { Child } from '../../types/child';
import { Modal } from '../Modal';
import { Button } from '../ui/button';
import { FolderOpen, Plus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StudentDocumentsSection } from './StudentDocumentsSection';

interface QuickStudentDocumentsModalProps {
  child: Child | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function QuickStudentDocumentsModal({
  child,
  isOpen,
  onClose,
  onUpdated,
}: QuickStudentDocumentsModalProps) {
  const navigate = useNavigate();

  if (!child) return null;

  const fullName = [child.lastName, child.firstName, child.middleName]
    .filter(Boolean)
    .join(' ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Документы: ${fullName}`}
      eyebrow={`Класс: ${child.group?.name || '—'}`}
      description="Быстрый просмотр и прикрепление дипломов, анкет, справок и других документов."
      size="xl"
      meta={
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onClose();
            navigate(`/children/${child.id}`);
          }}
          className="gap-1 text-[12px]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Перейти в профиль
        </Button>
      }
    >
      <div className="pt-1">
        <StudentDocumentsSection
          childId={child.id}
          childName={fullName}
        />
      </div>
    </Modal>
  );
}
