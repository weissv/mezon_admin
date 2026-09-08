// src/pages/ChildrenPage.tsx
// Премиальный реестр контингента учащихся с интерактивным Slide-Over Drawer и сегментированной фильтрацией
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  PlusCircle,
  Search,
  Download,
  UploadCloud,
  Trash2,
  AlertCircle,
  Eye,
  Archive,
  Filter,
  X,
  Users,
  Paperclip,
  GraduationCap,
  Lock,
  Phone,
  Calendar,
  Sparkles,
  Edit,
  CheckCircle2,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal, ModalActions, ModalNotice, ModalSection } from '../components/Modal';
import { Card } from '../components/Card';
import { ChildForm } from '../components/forms/ChildForm';
import { StudentProfileDrawer } from '../components/children/StudentProfileDrawer';
import { useChildren, useChildMutations, useGroups } from '../hooks/useChildren';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { PageHeader, PageSection, PageStack, PageToolbar } from '../components/ui/page';
import type { Child, ChildFilters, Gender } from '../types/child';

const selectClassName = 'mezon-field';

function getAgeCompact(birthDateStr?: string | null): string {
  if (!birthDateStr) return '';
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    years--;
  }
  if (years < 0) return '';

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
  const colors: Record<string, string> = {
    ACTIVE: 'macos-badge-success',
    LEFT: 'macos-badge-warning',
    ARCHIVED: 'macos-badge-neutral',
  };
  const labels: Record<string, string> = {
    ACTIVE: 'Активен',
    LEFT: 'Выбыл',
    ARCHIVED: 'Архив',
  };
  return (
    <span className={`mezon-badge ${colors[s] ?? 'macos-badge-neutral'}`}>
      {labels[s] ?? s}
    </span>
  );
};

export default function ChildrenPage() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const isDeputy = user?.role === 'DEPUTY';
  const teacherClassGroups = user?.employee?.classGroups || [];
  const isClassTeacher = teacherClassGroups.length > 0;
  const primaryClass = teacherClassGroups[0];
  const isDeputyWithClass = isDeputy && isClassTeacher;

  // Для завуча, назначенного классным руководителем: переключатель режима
  const [deputyTab, setDeputyTab] = useState<'ALL' | 'MY_CLASS'>('ALL');

  const {
    data,
    total,
    page,
    filters,
    loading,
    setPage,
    setFilters,
    refresh,
  } = useChildren({
    sortBy: 'lastName',
    pageSize: 12,
    ...(isTeacher && isClassTeacher && primaryClass?.id ? { initialPage: 1 } : {}),
  });

  const { archiveChild, deleteChild, saving } = useChildMutations();
  const { groups } = useGroups();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Child | null>(null);
  const [drawerChild, setDrawerChild] = useState<Child | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Автоматическая фиксация класса для учителя-классного руководителя
  useEffect(() => {
    if (isTeacher && isClassTeacher && primaryClass?.id) {
      setFilters((prev: ChildFilters) => ({ ...prev, groupId: primaryClass.id }));
    }
  }, [isTeacher, isClassTeacher, primaryClass?.id]);

  // --- Search handler ---
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev: ChildFilters) => ({ ...prev, search: searchInput || undefined }));
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- Handlers ---
  const handleCreate = () => {
    setEditingChild(null);
    setIsModalOpen(true);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setIsModalOpen(true);
  };

  const handleOpenDrawer = (child: Child) => {
    setDrawerChild(child);
    setIsDrawerOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    refresh();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.download('/api/integration/export/excel/children');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `children-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Шаблон с детьми выгружен');
    } catch (err: any) {
      toast.error('Не удалось скачать шаблон', { description: err?.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteChild(deleteConfirm.id);
      setDeleteConfirm(null);
      if (drawerChild?.id === deleteConfirm.id) {
        setIsDrawerOpen(false);
        setDrawerChild(null);
      }
      refresh();
    } catch {
      // toast handled in hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async (child: Child) => {
    await archiveChild(child.id);
    refresh();
  };

  const hasActiveFilters = !!(
    filters.status ||
    (filters.groupId && !isTeacher && deputyTab !== 'MY_CLASS') ||
    filters.gender
  );

  const clearFilters = () => {
    if (isTeacher && isClassTeacher && primaryClass?.id) {
      setFilters({ groupId: primaryClass.id });
    } else if (isDeputyWithClass && deputyTab === 'MY_CLASS' && primaryClass?.id) {
      setFilters({ groupId: primaryClass.id });
    } else {
      setFilters({});
    }
    setSearchInput('');
  };

  // Экран блокировки для учителя-предметника (НЕ классного руководителя)
  if (isTeacher && !isClassTeacher) {
    return (
      <PageStack>
        <PageHeader
          eyebrow="Контингент"
          title="Раздел учеников"
          icon={<Users className="h-5 w-5" />}
          description="Доступ к персональным карточкам и документам учащихся открыт исключительно классным руководителям."
        />
        <Card className="py-14 px-6 text-center max-w-lg mx-auto my-10 shadow-subtle border border-separator/50">
          <div className="mx-auto w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-amber-500/20">
            <Lock className="h-7 w-7" />
          </div>
          <h2 className="text-[18px] font-semibold text-text-primary mb-2">
            Доступ только для классных руководителей
          </h2>
          <p className="text-[14px] text-text-secondary leading-relaxed mb-6">
            Вы авторизованы как учитель-предметник. Личные дела, документы и карточки учеников доступны только классным руководителям для их классов.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate('/schedule')}>
              Перейти к расписанию
            </Button>
            <Button onClick={() => navigate('/dashboard')}>
              В рабочий кабинет
            </Button>
          </div>
        </Card>
      </PageStack>
    );
  }

  // --- Columns Configuration ---
  const columns: Column<Child>[] = [
    {
      key: 'fullName',
      header: 'Ученик',
      render: (row) => {
        const initials = `${(row.lastName || '')[0] || ''}${(row.firstName || '')[0] || ''}`.toUpperCase();
        const avatarGradient = row.gender === 'FEMALE'
          ? 'from-rose-500 to-amber-500'
          : 'from-blue-600 to-indigo-600';
        const age = getAgeCompact(row.birthDate);

        return (
          <div className="flex items-center gap-3 py-0.5">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white text-[12px] font-bold tracking-tight shadow-sm flex-shrink-0`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-text-primary group-hover:text-macos-blue transition-colors text-[13.5px] truncate">
                {row.lastName} {row.firstName} {row.middleName || ''}
              </div>
              <div className="text-[11.5px] text-text-tertiary flex items-center gap-1.5 mt-0.5">
                {age && <span>{age}</span>}
                {age && <span>•</span>}
                <span>д.р. {new Date(row.birthDate).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'group',
      header: 'Класс',
      width: '120px',
      render: (row) => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-secondary text-text-primary text-[12px] font-medium border border-separator/40">
          <GraduationCap className="h-3.5 w-3.5 text-text-tertiary" />
          <span>{row.group.name}</span>
        </span>
      ),
    },
    {
      key: 'parents',
      header: 'Родители / Контакты',
      render: (row) => {
        if (row.parents?.length) {
          const mainParent = row.parents[0];
          return (
            <div className="text-[12.5px] py-0.5">
              <div className="font-medium text-text-primary truncate max-w-[220px]">
                {mainParent.fullName}
                <span className="text-[11px] text-text-tertiary font-normal ml-1.5">
                  ({mainParent.relation || 'Родитель'})
                </span>
              </div>
              {mainParent.phone && (
                <a
                  href={`tel:${mainParent.phone}`}
                  data-prevent-row-click="true"
                  className="inline-flex items-center gap-1 text-[11.5px] text-macos-blue hover:underline mt-0.5"
                  title="Позвонить родителю"
                >
                  <Phone className="h-3 w-3" />
                  <span>{mainParent.phone}</span>
                </a>
              )}
            </div>
          );
        }
        if (row.parentPhone) {
          return (
            <a
              href={`tel:${row.parentPhone}`}
              data-prevent-row-click="true"
              className="inline-flex items-center gap-1 text-[12px] text-macos-blue hover:underline"
            >
              <Phone className="h-3 w-3" />
              <span>{row.parentPhone}</span>
            </a>
          );
        }
        return <span className="text-text-tertiary text-xs">—</span>;
      },
    },
    {
      key: 'documents',
      header: 'Документы',
      width: '120px',
      render: (row) => {
        const count = row._count?.documents ?? (row.documents?.length || 0);
        const hasDocs = count > 0;
        return (
          <button
            type="button"
            data-prevent-row-click="true"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDrawer(row);
            }}
            className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-medium transition-all cursor-pointer border",
              hasDocs
                ? "bg-surface-secondary/70 text-text-secondary hover:text-macos-blue hover:bg-tint-blue hover:border-macos-blue/30 border-separator/40"
                : "bg-surface-secondary/30 text-text-tertiary hover:text-text-primary border-separator/20"
            )}
            title="Открыть документы ученика"
          >
            <Paperclip className="h-3.5 w-3.5" />
            <span>{hasDocs ? `${count} док.` : '0 док.'}</span>
          </button>
        );
      },
    },
    {
      key: 'status',
      header: 'Статус',
      width: '110px',
      render: (row) => statusBadge(row.status),
    },
    {
      key: 'actions',
      header: '',
      width: '130px',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" data-prevent-row-click="true">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-text-tertiary hover:text-macos-blue rounded-lg"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDrawer(row);
            }}
            title="Быстрое досье (Slide-Over)"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {!isTeacher && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-text-tertiary hover:text-text-primary rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              title="Редактировать анкету"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}

          {!isTeacher && row.status === 'ACTIVE' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-text-tertiary hover:text-amber-600 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleArchive(row);
              }}
              disabled={saving}
              title="Переместить в архив"
            >
              <Archive className="h-4 w-4" />
            </Button>
          )}

          {!isTeacher && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-text-tertiary hover:text-macos-red rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(row);
              }}
              title="Удалить профиль"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const pageTitle = isTeacher && isClassTeacher
    ? `Мой класс (${primaryClass?.name})`
    : isDeputyWithClass && deputyTab === 'MY_CLASS'
    ? `Мой класс (${primaryClass?.name})`
    : 'Контингент учащихся';

  const pageEyebrow = (isTeacher && isClassTeacher) || (isDeputyWithClass && deputyTab === 'MY_CLASS')
    ? `Классный руководитель: ${primaryClass?.name}`
    : 'Школьный контингент';

  const pageDescription = (isTeacher && isClassTeacher) || (isDeputyWithClass && deputyTab === 'MY_CLASS')
    ? `Список учащихся вашего класса (${primaryClass?.name}). Просмотр документов, данных родителей и карточек учеников.`
    : 'Единый реестр личных дел, документов, медицинских сведений и семейных контактов с быстрым интерактивным досье.';

  return (
    <PageStack>
      <PageHeader
        eyebrow={pageEyebrow}
        title={pageTitle}
        icon={<Users className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral font-semibold">{total} учащихся</span>}
        description={pageDescription}
        actions={
          <div className="flex items-center gap-2">
            {!isTeacher && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>{isExporting ? 'Экспорт...' : 'Экспорт Excel'}</span>
              </Button>
            )}

            {!isTeacher && (
              <Button onClick={handleCreate} size="sm" className="gap-1.5 font-medium shadow-sm">
                <PlusCircle className="h-4 w-4" />
                <span>Добавить ученика</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Вкладки для завуча, назначенного классным руководителем */}
      {isDeputyWithClass && (
        <div className="flex items-center gap-1.5 p-1 bg-surface-secondary/70 backdrop-blur-md rounded-2xl border border-separator/40 max-w-fit shadow-subtle mb-1">
          <button
            type="button"
            onClick={() => {
              setDeputyTab('ALL');
              setFilters((prev) => {
                const next = { ...prev };
                delete next.groupId;
                return next;
              });
              setPage(1);
            }}
            className={clsx(
              "px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer",
              deputyTab === 'ALL'
                ? "bg-white dark:bg-surface text-text-primary shadow-sm font-semibold border border-separator/30"
                : "text-text-secondary hover:text-text-primary hover:bg-white/40"
            )}
          >
            <Users className="h-3.5 w-3.5 text-text-tertiary" />
            <span>Все ученики</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDeputyTab('MY_CLASS');
              setFilters((prev) => ({ ...prev, groupId: primaryClass?.id }));
              setPage(1);
            }}
            className={clsx(
              "px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer",
              deputyTab === 'MY_CLASS'
                ? "bg-white dark:bg-surface text-macos-blue shadow-sm font-semibold border border-macos-blue/20"
                : "text-text-secondary hover:text-macos-blue hover:bg-white/40"
            )}
          >
            <GraduationCap className="h-3.5 w-3.5 text-macos-blue" />
            <span>Мой класс ({primaryClass?.name})</span>
          </button>
        </div>
      )}

      {/* Segmented Status Tabs + Primary Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface-primary/80 backdrop-blur-md p-2 rounded-2xl border border-separator/40 shadow-subtle">
        {/* Segmented Status Bar */}
        <div className="flex items-center gap-1 p-1 bg-surface-secondary/80 rounded-xl border border-separator/30 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setFilters((prev: ChildFilters) => ({ ...prev, status: undefined }));
              setPage(1);
            }}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer",
              !filters.status
                ? "bg-white dark:bg-surface text-text-primary shadow-sm font-semibold"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            Все
          </button>

          <button
            type="button"
            onClick={() => {
              setFilters((prev: ChildFilters) => ({ ...prev, status: 'ACTIVE' }));
              setPage(1);
            }}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              filters.status === 'ACTIVE'
                ? "bg-white dark:bg-surface text-emerald-600 shadow-sm font-semibold"
                : "text-text-secondary hover:text-emerald-600"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Активные</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilters((prev: ChildFilters) => ({ ...prev, status: 'LEFT' }));
              setPage(1);
            }}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              filters.status === 'LEFT'
                ? "bg-white dark:bg-surface text-amber-600 shadow-sm font-semibold"
                : "text-text-secondary hover:text-amber-600"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Выбывшие</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilters((prev: ChildFilters) => ({ ...prev, status: 'ARCHIVED' }));
              setPage(1);
            }}
            className={clsx(
              "px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
              filters.status === 'ARCHIVED'
                ? "bg-white dark:bg-surface text-text-primary shadow-sm font-semibold"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <Archive className="h-3 w-3 text-text-tertiary" />
            <span>Архив</span>
          </button>
        </div>

        {/* Search Input and Quick Class Select */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <div className="mezon-input-shell flex-1">
            <Search className="mezon-input-shell__icon h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Поиск по фамилии, имени, родителю..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-8"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 p-1 rounded-full text-text-tertiary hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Group Selector directly in toolbar */}
          {(!isTeacher || teacherClassGroups.length > 1) && deputyTab !== 'MY_CLASS' && (
            <div className="w-44 flex-shrink-0">
              <select
                className={clsx(selectClassName, "text-xs py-2")}
                value={filters.groupId ?? ''}
                onChange={(e) => {
                  setFilters((prev: ChildFilters) => ({
                    ...prev,
                    groupId: e.target.value ? Number(e.target.value) : undefined,
                  }));
                  setPage(1);
                }}
              >
                <option value="">Все классы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0 text-xs gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Фильтр</span>
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 rounded-full bg-macos-blue inline-block" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex-shrink-0 text-xs px-2 text-text-secondary hover:text-macos-red"
              title="Сбросить все фильтры"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded filters panel */}
      {showFilters && (
        <PageSection className="p-4 rounded-2xl bg-surface-secondary/40 border border-separator/30">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                Пол учащегося
              </label>
              <select
                className={selectClassName}
                value={filters.gender ?? ''}
                onChange={(e) => {
                  setFilters((prev: ChildFilters) => ({
                    ...prev,
                    gender: (e.target.value as Gender) || undefined,
                  }));
                  setPage(1);
                }}
              >
                <option value="">Любой пол</option>
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                Быстрые ссылки
              </label>
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => navigate('/integration#children')}
                >
                  <UploadCloud className="h-3.5 w-3.5 mr-1.5 text-macos-blue" />
                  Импорт из Excel
                </Button>
              </div>
            </div>
          </div>
        </PageSection>
      )}

      {/* Main Interactive Table */}
      <DataTable
        title={
          (isTeacher && isClassTeacher) || (isDeputyWithClass && deputyTab === 'MY_CLASS')
            ? `Ученики (${primaryClass?.name})`
            : "Реестр учащихся"
        }
        description="Кликните на строку ученика для мгновенного открытия досье и работы с документами."
        columns={columns}
        data={data}
        page={page}
        pageSize={12}
        total={total}
        onPageChange={setPage}
        onRowClick={handleOpenDrawer}
        wrapCells={true}
        density="compact"
      />

      {/* Apple Slide-Over Student Profile Drawer */}
      <StudentProfileDrawer
        child={drawerChild}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onEdit={handleEdit}
        onArchive={handleArchive}
        canManage={!isTeacher}
        onUpdated={refresh}
      />

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChild ? 'Редактировать анкету ученика' : 'Добавить нового ученика'}
        eyebrow="Контингент"
        description="Форма собрана по смысловым блокам: персональные данные, родители, договор и медицинские сведения."
        icon={<Users className="h-5 w-5" />}
        size="xl"
        meta={
          editingChild ? (
            <span className="mezon-badge macos-badge-neutral">Редактирование</span>
          ) : (
            <span className="mezon-badge">Новый профиль</span>
          )
        }
      >
        <ChildForm
          initialData={editingChild}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление профиля ученика"
        eyebrow="Опасное действие"
        description="Профиль ребёнка будет удалён вместе со связанными записями посещаемости и кружков."
        icon={<AlertCircle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!isDeleting}
        closeOnEscape={!isDeleting}
        footer={
          <ModalActions>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить безвозвратно'}
            </Button>
          </ModalActions>
        }
      >
        {deleteConfirm ? (
          <>
            <ModalNotice title="Удаление затронет связанные данные" tone="danger">
              Будут удалены посещаемость, отсутствия и записи в кружки, связанные с этим профилем. Это действие нельзя отменить.
            </ModalNotice>

            <ModalSection title="Проверка профиля" description="Убедитесь, что выбран нужный ученик.">
              <div className="mezon-modal-facts">
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Ученик</span>
                  <span className="mezon-modal-fact__value">
                    {deleteConfirm.lastName} {deleteConfirm.firstName}
                  </span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Класс</span>
                  <span className="mezon-modal-fact__value">
                    {deleteConfirm.group?.name || 'Не указан'}
                  </span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Статус</span>
                  <span className="mezon-modal-fact__value">
                    {deleteConfirm.status === 'ACTIVE'
                      ? 'Активен'
                      : deleteConfirm.status === 'LEFT'
                      ? 'Выбыл'
                      : 'В архиве'}
                  </span>
                </div>
              </div>
            </ModalSection>
          </>
        ) : null}
      </Modal>
    </PageStack>
  );
}
