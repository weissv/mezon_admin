// src/components/children/StudentProfileDrawer.tsx
// Премиальная выкатная панель (Slide-Over Sheet) досье ученика в стиле Apple macOS / iPadOS
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  User,
  Shield,
  HeartPulse,
  FileText,
  Edit,
  Archive,
  GraduationCap,
  MapPin,
  Building,
  Mail,
  FolderOpen,
  CalendarX,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { StudentDocumentsSection } from './StudentDocumentsSection';
import { AbsencesView } from './AbsencesView';
import { useChild } from '../../hooks/useChildren';
import { toast } from 'sonner';
import type { Child, Gender, Parent } from '../../types/child';

interface StudentProfileDrawerProps {
  child: Child | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (child: Child) => void;
  onArchive?: (child: Child) => void;
  canManage?: boolean;
  onUpdated?: () => void;
}

type TabKey = 'overview' | 'documents' | 'absences';

function getAgeString(birthDateStr?: string | null): string {
  if (!birthDateStr) return '—';
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 0) return '—';

  // Склонение слова "год/года/лет"
  const lastDigit = years % 10;
  const lastTwo = years % 100;
  let word = 'лет';
  if (lastTwo < 11 || lastTwo > 14) {
    if (lastDigit === 1) word = 'год';
    else if (lastDigit >= 2 && lastDigit <= 4) word = 'года';
  }
  return `${years} ${word}`;
}

const statusBadge = (s: string) => {
  switch (s) {
    case 'ACTIVE':
      return <Badge variant="success" dot>Активен</Badge>;
    case 'LEFT':
      return <Badge variant="warning" dot>Выбыл</Badge>;
    case 'ARCHIVED':
      return <Badge variant="neutral" dot>В архиве</Badge>;
    default:
      return <Badge variant="neutral">{s}</Badge>;
  }
};

export function StudentProfileDrawer({
  child: initialChild,
  isOpen,
  onClose,
  onEdit,
  onArchive,
  canManage = true,
  onUpdated,
}: StudentProfileDrawerProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Загружаем полные данные ребёнка (с документами, пропусками и родителями)
  const childId = initialChild?.id ?? null;
  const { child: fullChild, loading: childLoading, refresh: refreshChild } = useChild(isOpen ? childId : null);

  // Оптимистично используем либо полные данные, либо то, что уже было передано из таблицы
  const child = fullChild || initialChild;

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Сброс вкладки при смене ребёнка
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [childId, isOpen]);

  if (!isOpen && !child) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    toast.success(`${label} скопирован в буфер обмена`);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  const fullName = child
    ? [child.lastName, child.firstName, child.middleName].filter(Boolean).join(' ')
    : 'Карточка ученика';

  const initials = child
    ? `${(child.lastName || '')[0] || ''}${(child.firstName || '')[0] || ''}`.toUpperCase()
    : 'УЧ';

  const avatarGradient = child?.gender === 'FEMALE'
    ? 'from-rose-500 via-pink-500 to-amber-400'
    : 'from-blue-600 via-indigo-600 to-cyan-400';

  const docsCount = child?._count?.documents ?? child?.documents?.length ?? 0;
  const absencesCount = (child as any)?.temporaryAbsences?.length ?? child?._count?.temporaryAbsences ?? 0;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-surface/95 dark:bg-[#16181e]/95 backdrop-blur-2xl shadow-2xl border-l border-separator/40 flex flex-col transform transition-transform duration-300 ease-out sm:rounded-l-3xl overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-separator/30 bg-surface-secondary/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-macos-blue" />
            <span>Быстрое досье ученика</span>
          </div>

          <div className="flex items-center gap-2">
            {child && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-text-secondary hover:text-text-primary gap-1.5"
                onClick={() => {
                  onClose();
                  navigate(`/children/${child.id}`);
                }}
                title="Перейти к полной странице"
              >
                <span>Полный профиль</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Закрыть (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Hero Card Header */}
        {child ? (
          <div className="px-6 pt-5 pb-4 bg-gradient-to-b from-surface-secondary/30 to-transparent border-b border-separator/20">
            <div className="flex items-start gap-4">
              {/* Avatar Monogram */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white text-xl font-bold tracking-tight shadow-md flex-shrink-0`}
              >
                {initials}
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight text-text-primary truncate">
                    {fullName}
                  </h2>
                  {statusBadge(child.status)}
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary flex-wrap">
                  <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md bg-tint-blue text-macos-blue border border-macos-blue/20">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {child.group?.name || 'Без класса'}
                  </span>

                  <span className="inline-flex items-center gap-1 text-text-tertiary">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(child.birthDate).toLocaleDateString('ru-RU')} ({getAgeString(child.birthDate)})
                  </span>

                  <span className="text-text-tertiary">•</span>

                  <span className="text-text-tertiary">
                    Пол: {child.gender === 'MALE' ? 'Мужской' : child.gender === 'FEMALE' ? 'Женский' : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Tab Navigation */}
            <div className="flex items-center gap-1.5 mt-5 p-1 bg-surface-secondary/80 rounded-xl border border-separator/30 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Семья и профиль</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'documents'
                    ? 'bg-surface text-macos-blue shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-macos-blue'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Документы</span>
                {docsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-tint-blue text-macos-blue text-[10px] font-bold">
                    {docsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('absences')}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'absences'
                    ? 'bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <CalendarX className="h-3.5 w-3.5" />
                <span>Отсутствия</span>
                {absencesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 text-[10px] font-bold">
                    {absencesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto mezon-scrollbar p-6 space-y-5">
          {child && activeTab === 'overview' && (
            <>
              {/* Секция: Родители и Контакты */}
              <div className="bg-surface-primary rounded-2xl border border-separator/40 p-4 shadow-subtle">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-tint-blue text-macos-blue flex items-center justify-center">
                      <Phone className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      Контакты родителей и опекунов
                    </h3>
                  </div>
                  <span className="text-[11px] text-text-tertiary">
                    {child.parents?.length ? `${child.parents.length} чел.` : '1 клик для связи'}
                  </span>
                </div>

                {child.parents && child.parents.length > 0 ? (
                  <div className="space-y-2.5">
                    {child.parents.map((parent: Parent, idx: number) => (
                      <div
                        key={parent.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-surface-secondary/50 border border-separator/30 hover:border-macos-blue/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-text-primary">
                              {parent.fullName}
                            </span>
                            <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-surface text-text-tertiary border border-separator/30">
                              {parent.relation || 'Родитель'}
                            </span>
                          </div>
                          {parent.workplace && (
                            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mt-1">
                              <Building className="h-3 w-3" />
                              <span className="truncate">{parent.workplace}</span>
                            </div>
                          )}
                          {parent.email && (
                            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary mt-0.5">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{parent.email}</span>
                            </div>
                          )}
                        </div>

                        {parent.phone ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <a
                              href={`tel:${parent.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tint-blue text-macos-blue text-xs font-medium hover:bg-macos-blue hover:text-white transition-all shadow-sm"
                              title="Позвонить родителю"
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span>{parent.phone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(parent.phone!, 'Телефон')}
                              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
                              title="Скопировать телефон"
                            >
                              {copiedPhone === parent.phone ? (
                                <Check className="h-4 w-4 text-macos-green" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-tertiary italic">Телефон не указан</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-surface-secondary/40 border border-separator/30 text-center">
                    {child.parentPhone ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-secondary">Основной телефон:</span>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${child.parentPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-tint-blue text-macos-blue text-xs font-medium"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            <span>{child.parentPhone}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(child.parentPhone!, 'Телефон')}
                            className="p-1 rounded-lg hover:bg-surface text-text-tertiary hover:text-text-primary"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-text-tertiary">
                        Родители и контактные телефоны не внесены в анкету
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Секция: Здоровье и Особые условия */}
              <div className="bg-surface-primary rounded-2xl border border-separator/40 p-4 shadow-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <HeartPulse className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Здоровье и медицинские особенности
                  </h3>
                </div>

                {child.healthInfo && (
                  (child.healthInfo.allergies && child.healthInfo.allergies.length > 0) ||
                  (child.healthInfo.specialConditions && child.healthInfo.specialConditions.length > 0) ||
                  (child.healthInfo.medications && child.healthInfo.medications.length > 0) ||
                  child.healthInfo.notes
                ) ? (
                  <div className="space-y-2.5 text-xs">
                    {child.healthInfo.allergies && child.healthInfo.allergies.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400">
                        <span className="font-semibold block mb-1">⚠️ Аллергии:</span>
                        <span>{child.healthInfo.allergies.join(', ')}</span>
                      </div>
                    )}

                    {child.healthInfo.specialConditions && child.healthInfo.specialConditions.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
                        <span className="font-semibold block mb-1">Особые условия:</span>
                        <span>{child.healthInfo.specialConditions.join(', ')}</span>
                      </div>
                    )}

                    {child.healthInfo.medications && child.healthInfo.medications.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-surface-secondary/70 border border-separator/30 text-text-secondary">
                        <span className="font-semibold block mb-1 text-text-primary">Медикаменты:</span>
                        <span>{child.healthInfo.medications.join(', ')}</span>
                      </div>
                    )}

                    {child.healthInfo.notes && (
                      <div className="p-2.5 rounded-xl bg-surface-secondary/50 border border-separator/30 text-text-secondary">
                        <span className="font-semibold block mb-1 text-text-primary">Примечания медпункта:</span>
                        <span>{child.healthInfo.notes}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-text-tertiary bg-surface-secondary/30 p-3 rounded-xl border border-separator/20">
                    Особых противопоказаний, ограничений по физкультуре и аллергий не зафиксировано.
                  </p>
                )}
              </div>

              {/* Секция: Паспортные данные и Адрес */}
              <div className="bg-surface-primary rounded-2xl border border-separator/40 p-4 shadow-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-tint-blue text-macos-blue flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Реквизиты и адрес
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-secondary/40 border border-separator/20">
                    <span className="text-[11px] text-text-tertiary block">Свидетельство о рождении</span>
                    <span className="font-semibold text-text-primary mt-0.5 block">
                      {child.birthCertificateNumber || 'Не указан'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-secondary/40 border border-separator/20">
                    <span className="text-[11px] text-text-tertiary block">Национальность</span>
                    <span className="font-semibold text-text-primary mt-0.5 block">
                      {child.nationality || 'Не указана'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-secondary/40 border border-separator/20 sm:col-span-2">
                    <span className="text-[11px] text-text-tertiary block">Адрес проживания</span>
                    <span className="font-medium text-text-primary mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
                      {child.address || 'Адрес не внесён'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Секция: Приказы движения */}
              {(child.admissionOrderNumber || child.previousSchool || child.dismissalOrderNumber) && (
                <div className="bg-surface-primary rounded-2xl border border-separator/40 p-4 shadow-subtle">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      Приказы движения контингента
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    {child.admissionOrderNumber && (
                      <div className="flex justify-between items-center py-1 border-b border-separator/20">
                        <span className="text-text-tertiary">Приказ о зачислении:</span>
                        <span className="font-medium text-text-primary">
                          №{child.admissionOrderNumber} {child.admissionOrderDate ? `от ${new Date(child.admissionOrderDate).toLocaleDateString('ru-RU')}` : ''}
                        </span>
                      </div>
                    )}
                    {child.previousSchool && (
                      <div className="flex justify-between items-center py-1 border-b border-separator/20">
                        <span className="text-text-tertiary">Предыдущая школа:</span>
                        <span className="font-medium text-text-primary">{child.previousSchool}</span>
                      </div>
                    )}
                    {child.dismissalOrderNumber && (
                      <div className="flex justify-between items-center py-1 border-b border-separator/20 text-rose-600">
                        <span>Приказ об отчислении:</span>
                        <span className="font-medium">
                          №{child.dismissalOrderNumber} {child.dismissalOrderDate ? `от ${new Date(child.dismissalOrderDate).toLocaleDateString('ru-RU')}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Вкладка Документы */}
          {child && activeTab === 'documents' && (
            <div className="space-y-4">
              <StudentDocumentsSection
                childId={child.id}
                childName={fullName}
                initialDocuments={child.documents}
                onUpdated={() => {
                  refreshChild();
                  onUpdated?.();
                }}
              />
            </div>
          )}

          {/* Вкладка Отсутствия */}
          {child && activeTab === 'absences' && (
            <div className="space-y-4">
              <AbsencesView childId={child.id} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-separator/30 bg-surface-secondary/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {canManage && child && onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-medium"
                onClick={() => {
                  onClose();
                  onEdit(child);
                }}
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Редактировать</span>
              </Button>
            )}

            {canManage && child && child.status === 'ACTIVE' && onArchive && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-text-secondary hover:text-amber-600"
                onClick={() => {
                  onClose();
                  onArchive(child);
                }}
              >
                <Archive className="h-3.5 w-3.5" />
                <span>В архив</span>
              </Button>
            )}
          </div>

          <Button
            size="sm"
            className="gap-1.5 text-xs font-medium"
            onClick={() => {
              onClose();
              if (child) navigate(`/children/${child.id}`);
            }}
          >
            <span>Карточка ученика</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
