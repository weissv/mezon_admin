// src/pages/ChildrenPage.tsx
// Список детей с фильтрами, поиском и действиями
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
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal, ModalActions, ModalNotice, ModalSection } from '../components/Modal';
import { Card } from '../components/Card';
import { ChildForm } from '../components/forms/ChildForm';
import { QuickStudentDocumentsModal } from '../components/children/QuickStudentDocumentsModal';
import { useChildren, useChildMutations, useGroups } from '../hooks/useChildren';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { PageHeader, PageSection, PageStack, PageToolbar } from '../components/ui/page';
import type { Child, ChildFilters, Gender } from '../types/child';

const selectClassName = 'mezon-field';

const genderLabel = (g?: Gender | null) => {
  if (g === 'MALE') return 'М';
  if (g === 'FEMALE') return 'Ж';
  return '—';
};

const statusLabel = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'Активен';
    case 'LEFT': return 'Выбыл';
    case 'ARCHIVED': return 'Архив';
    default: return s;
  }
};

const statusBadge = (s: string) => {
  const colors: Record<string, string> = {
    ACTIVE: 'macos-badge-success',
    LEFT: 'macos-badge-warning',
    ARCHIVED: 'macos-badge-neutral',
  };
  return (
    <span className={`mezon-badge ${colors[s] ?? 'macos-badge-neutral'}`}>
      {statusLabel(s)}
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
    // Если заходит классный руководитель, сразу фильтруем по его классу
    ...(isTeacher && isClassTeacher && primaryClass?.id ? { initialPage: 1 } : {}),
  });

  const { archiveChild, deleteChild, saving } = useChildMutations();
  const { groups } = useGroups();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Child | null>(null);
  const [selectedChildForDocs, setSelectedChildForDocs] = useState<Child | null>(null);
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
  const handleCreate = () => { setEditingChild(null); setIsModalOpen(true); };
  const handleEdit = (child: Child) => { setEditingChild(child); setIsModalOpen(true); };
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
      refresh();
    } catch {
      // toast from hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async (child: Child) => {
    await archiveChild(child.id);
    refresh();
  };

  const hasActiveFilters = !!(filters.status || (filters.groupId && !isTeacher && deputyTab !== 'MY_CLASS') || filters.gender);

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

  // --- Columns ---
  const columns: Column<Child>[] = [
    { key: 'id', header: '№' },
    {
      key: 'fullName',
      header: 'ФИО',
      render: (row) => (
        <button
          className="text-left text-macos-blue hover:underline font-medium cursor-pointer"
          onClick={() => navigate(`/children/${row.id}`)}
        >
          {row.lastName} {row.firstName} {row.middleName || ''}
        </button>
      ),
    },
    { key: 'group', header: 'Класс', render: (row) => row.group.name },
    {
      key: 'birthDate',
      header: 'Дата рожд.',
      render: (row) => new Date(row.birthDate).toLocaleDateString('ru-RU'),
    },
    { key: 'gender', header: 'Пол', render: (row) => genderLabel(row.gender) },
    {
      key: 'parents',
      header: 'Родители',
      render: (row) => {
        if (row.parents?.length) {
          return (
            <div className="text-sm">
              {row.parents.map((p) => (
                <div key={p.id}>
                  {p.fullName}{p.phone ? ` (${p.phone})` : ''}
                </div>
              ))}
            </div>
          );
        }
        return row.parentPhone || '—';
      },
    },
    {
      key: 'documents',
      header: 'Документы',
      render: (row) => {
        const count = row._count?.documents ?? (row.documents?.length || 0);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChildForDocs(row);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px] font-medium transition-all bg-surface-secondary/70 hover:bg-tint-blue hover:text-macos-blue border border-separator/40 hover:border-macos-blue/30 group cursor-pointer"
            title="Открыть документы ученика"
          >
            <Paperclip className="h-3.5 w-3.5 text-text-tertiary group-hover:text-macos-blue" />
            <span>{count > 0 ? count : '0'}</span>
          </button>
        );
      },
    },
    { key: 'status', header: 'Статус', render: (row) => statusBadge(row.status) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/children/${row.id}`)} title="Профиль">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedChildForDocs(row)} title="Документы">
            <Paperclip className="h-4 w-4" />
          </Button>
          {(!isTeacher) && (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} title="Редактировать">
              <PlusCircle className="h-4 w-4" />
            </Button>
          )}
          {(!isTeacher) && row.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" onClick={() => handleArchive(row)} disabled={saving} title="В архив">
              <Archive className="h-4 w-4" />
            </Button>
          )}
          {(!isTeacher) && (
            <Button variant="ghost" size="sm" className="text-macos-red" onClick={() => setDeleteConfirm(row)} title="Удалить">
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
    : 'Управление профилями детей';

  const pageEyebrow = (isTeacher && isClassTeacher) || (isDeputyWithClass && deputyTab === 'MY_CLASS')
    ? `Классный руководитель: ${primaryClass?.name}`
    : 'Контингент';

  const pageDescription = (isTeacher && isClassTeacher) || (isDeputyWithClass && deputyTab === 'MY_CLASS')
    ? `Список учащихся вашего класса (${primaryClass?.name}). Просмотр документов, данных родителей и карточек учеников.`
    : 'Единый список учеников, статусов и семейных контактов. Экран приведён к общему ERP-паттерну: короткий header, плотная панель действий и предсказуемые фильтры.';

  return (
    <PageStack>
      <PageHeader
        eyebrow={pageEyebrow}
        title={pageTitle}
        icon={<Users className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral">{total} записей</span>}
        description={pageDescription}
        actions={
          <div className="mezon-kicker-list">
            {(isTeacher && isClassTeacher) || (isDeputyWithClass && deputyTab === 'MY_CLASS') ? (
              <span className="mezon-chip bg-tint-blue/70 text-macos-blue font-semibold border border-macos-blue/20">
                <GraduationCap className="h-3.5 w-3.5 inline mr-1" />
                {primaryClass?.name}
              </span>
            ) : null}
            <span className="mezon-chip">Профили</span>
            <span className="mezon-chip">Документы</span>
          </div>
        }
      />

      {/* Вкладки для завуча, назначенного классным руководителем */}
      {isDeputyWithClass && (
        <div className="flex items-center gap-2 p-1.5 bg-surface-secondary/70 backdrop-blur-md rounded-2xl border border-separator/40 max-w-fit shadow-subtle mb-3">
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
              "px-4 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer",
              deputyTab === 'ALL'
                ? "bg-white text-text-primary shadow-sm font-semibold border border-separator/30"
                : "text-text-secondary hover:text-text-primary hover:bg-white/40"
            )}
          >
            <Users className="h-4 w-4 text-text-tertiary" />
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
              "px-4 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 cursor-pointer",
              deputyTab === 'MY_CLASS'
                ? "bg-white text-macos-blue shadow-sm font-semibold border border-macos-blue/20"
                : "text-text-secondary hover:text-macos-blue hover:bg-white/40"
            )}
          >
            <GraduationCap className="h-4 w-4 text-macos-blue" />
            <span>Мой класс ({primaryClass?.name})</span>
          </button>
        </div>
      )}

      {/* Import/Export Card (только для админов/завучей) */}
      {!isTeacher && (
        <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-subtle">
          <div>
            <p className="text-[14px] font-semibold tracking-[-0.01em]">Массовая загрузка списков</p>
            <p className="text-[14px] leading-relaxed text-secondary mt-1">Импортируйте детей из Excel/Google Sheets или выгрузите актуальный шаблон.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" /> {isExporting ? 'Готовим...' : 'Шаблон Excel'}
            </Button>
            <Button onClick={() => navigate('/integration#children')}>
              <UploadCloud className="mr-2 h-4 w-4" /> Перейти к импорту
            </Button>
          </div>
        </Card>
      )}

      {/* Search + Filters + Add */}
      <PageToolbar className="mb-4">
        <div className="mezon-toolbar-group flex-1">
          <div className="mezon-input-shell max-w-sm">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              placeholder="Поиск по ФИО..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" /> Фильтры
            {hasActiveFilters && <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs text-black">!</span>}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Сбросить
            </Button>
          )}
        </div>
        {!isTeacher && (
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить ребенка
          </Button>
        )}
      </PageToolbar>

      {/* Filters panel */}
      {showFilters && (
        <PageSection className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest">Статус</label>
              <select
                className={selectClassName}
                value={filters.status ?? ''}
                onChange={(e) => {
                  setFilters((prev: ChildFilters) => ({ ...prev, status: (e.target.value as any) || undefined }));
                  setPage(1);
                }}
              >
                <option value="">Все</option>
                <option value="ACTIVE">Активные</option>
                <option value="LEFT">Выбывшие</option>
                <option value="ARCHIVED">Архив</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest">Класс</label>
              {isTeacher && isClassTeacher ? (
                teacherClassGroups.length > 1 ? (
                  <select
                    className={selectClassName}
                    value={filters.groupId ?? ''}
                    onChange={(e) => {
                      setFilters((prev: ChildFilters) => ({ ...prev, groupId: e.target.value ? Number(e.target.value) : undefined }));
                      setPage(1);
                    }}
                  >
                    {teacherClassGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="mezon-field flex items-center gap-1.5 bg-surface-secondary/60 text-text-primary font-medium cursor-not-allowed">
                    <span>{primaryClass?.name}</span>
                    <span className="text-[11px] text-text-tertiary">(Ваш класс)</span>
                  </div>
                )
              ) : isDeputyWithClass && deputyTab === 'MY_CLASS' ? (
                <div className="mezon-field flex items-center gap-1.5 bg-surface-secondary/60 text-text-primary font-medium cursor-not-allowed">
                  <span>{primaryClass?.name}</span>
                  <span className="text-[11px] text-text-tertiary">(Ваш класс)</span>
                </div>
              ) : (
                <select
                  className={selectClassName}
                  value={filters.groupId ?? ''}
                  onChange={(e) => {
                    setFilters((prev: ChildFilters) => ({ ...prev, groupId: e.target.value ? Number(e.target.value) : undefined }));
                    setPage(1);
                  }}
                >
                  <option value="">Все классы</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-widest">Пол</label>
              <select
                className={selectClassName}
                value={filters.gender ?? ''}
                onChange={(e) => {
                  setFilters((prev: ChildFilters) => ({ ...prev, gender: (e.target.value as Gender) || undefined }));
                  setPage(1);
                }}
              >
                <option value="">Все</option>
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
              </select>
            </div>
          </div>
        </PageSection>
      )}

      {/* Table */}
      <DataTable
        title={isTeacher && isClassTeacher || (isDeputyWithClass && deputyTab === 'MY_CLASS') ? `Ученики (${primaryClass?.name})` : "Список учеников"}
        description="Просматривайте статусы, родителей, прикрепленные документы и классы."
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        wrapCells={true}
        density="compact"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChild ? 'Редактировать данные' : 'Добавить нового ребенка'}
        eyebrow="Контингент"
        description="Форма собрана по блокам, чтобы администратор мог спокойно пройти по персональным данным, родителям, договору и мединформации без лишней прокрутки внутри модалки."
        icon={<Users className="h-5 w-5" />}
        size="xl"
        meta={editingChild ? <span className="mezon-badge macos-badge-neutral">Редактирование</span> : <span className="mezon-badge">Новый профиль</span>}
      >
        <ChildForm
          initialData={editingChild}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление ученика"
        eyebrow="Опасное действие"
        description="Профиль ребёнка будет удалён вместе со связанными записями. Перед подтверждением проверьте, что удаляется именно нужный ученик."
        icon={<AlertCircle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!isDeleting}
        closeOnEscape={!isDeleting}
        footer={
          <ModalActions>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </ModalActions>
        }
      >
        {deleteConfirm ? (
          <>
            <ModalNotice title="Удаление затронет связанные данные" tone="danger">
              Будут удалены посещаемость, отсутствия и записи в кружки, связанные с этим профилем. Это действие нельзя отменить.
            </ModalNotice>

            <ModalSection title="Проверка профиля" description="Убедитесь, что выбрали правильного ученика.">
              <div className="mezon-modal-facts">
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Ученик</span>
                  <span className="mezon-modal-fact__value">{deleteConfirm.lastName} {deleteConfirm.firstName}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Класс</span>
                  <span className="mezon-modal-fact__value">{deleteConfirm.group?.name || 'Не указан'}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Статус</span>
                  <span className="mezon-modal-fact__value">{statusLabel(deleteConfirm.status)}</span>
                </div>
              </div>
            </ModalSection>
          </>
        ) : null}
      </Modal>

      {/* Quick Student Documents Modal */}
      <QuickStudentDocumentsModal
        child={selectedChildForDocs}
        isOpen={!!selectedChildForDocs}
        onClose={() => setSelectedChildForDocs(null)}
        onUpdated={refresh}
      />
    </PageStack>
  );
}
