import { useEffect, useMemo, useState } from 'react';
import { Edit, RotateCcw, Search, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Modal, ModalActions, ModalNotice, ModalSection } from '../../components/Modal';
import { DataTable, Column } from '../../components/DataTable/DataTable';
import { UserForm } from '../../components/forms/UserForm';
import { EmptyListState, ErrorState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/input';
import { LoadingCard } from '../../components/ui/LoadingState';
import { PageToolbar } from '../../components/ui/page';
import { Button } from '../../components/ui/button';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { ROLE_COLORS, ROLE_LABELS } from '../../lib/roles';
import type { User } from '../../types/user';

const STATUS_LABELS: Record<User['status'], string> = {
 ACTIVE: 'Активен',
 INACTIVE: 'Деактивирован',
};

const STATUS_COLORS: Record<User['status'], string> = {
 ACTIVE: 'bg-emerald-100 text-emerald-700',
 INACTIVE: 'bg-slate-200 text-slate-700',
};

export function UsersDirectoryView() {
  const { data, total, page, setPage, fetchData, loading, error, setFilters } = useApi<User>({
    url: '/api/users',
    filters: { status: 'ACTIVE' },
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectClassName = 'mezon-field';

  useEffect(() => {
    setPage(1);
    setFilters({
      search: search.trim() || undefined,
      role: roleFilter || undefined,
      status: statusFilter,
    });
  }, [search, roleFilter, statusFilter, setFilters, setPage]);

  const counts = useMemo(() => {
    const active = data.filter((user) => user.status === 'ACTIVE').length;
    const inactive = data.filter((user) => user.status === 'INACTIVE').length;
    return { active, inactive };
  }, [data]);

  const columns: Column<User>[] = [
    { key: 'id', header: 'ID' },
    { key: 'email', header: 'Логин' },
    {
      key: 'role',
      header: 'Роль',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[row.role]}`}>
          {ROLE_LABELS[row.role]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[row.status]}`}>
          {STATUS_LABELS[row.status]}
        </span>
      ),
    },
    {
      key: 'employee',
      header: 'Сотрудник',
      render: (row) => (row.employee ? `${row.employee.lastName} ${row.employee.firstName}` : '—'),
    },
    {
      key: 'position',
      header: 'Должность',
      render: (row) => row.employee?.position || '—',
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingUser(row);
              setIsModalOpen(true);
            }}
            aria-label={`Редактировать пользователя ${row.email}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {row.status === 'ACTIVE' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteTarget(row)}
              aria-label={`Деактивировать пользователя ${row.email}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleRestore(row)}
              disabled={restoringId === row.id}
              aria-label={`Восстановить пользователя ${row.email}`}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleRestore = async (user: User) => {
    setRestoringId(user.id);
    try {
      await api.post(`/api/users/${user.id}/restore`);
      toast.success('Учётная запись восстановлена');
      await fetchData();
    } catch (error: any) {
      toast.error('Не удалось восстановить пользователя', { description: error?.message });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/users/${deleteTarget.id}`);
      toast.success('Учётная запись деактивирована');
      setDeleteTarget(null);
      await fetchData();
    } catch (error: any) {
      toast.error('Не удалось деактивировать пользователя', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="mezon-card p-4">
          <p className="text-sm text-secondary">На странице</p>
          <p className="mt-1 text-2xl font-semibold">{data.length}</p>
        </div>
        <div className="mezon-card p-4">
          <p className="text-sm text-secondary">Активные</p>
          <p className="mt-1 text-2xl font-semibold">{counts.active}</p>
        </div>
        <div className="mezon-card p-4">
          <p className="text-sm text-secondary">Деактивированные</p>
          <p className="mt-1 text-2xl font-semibold">{counts.inactive}</p>
        </div>
      </div>

      <PageToolbar>
        <div className="mezon-toolbar-group">
          <div className="mezon-input-shell">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по логину, ФИО или должности"
              className="min-w-[280px]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className={selectClassName}
          >
            <option value="">Все роли</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'ACTIVE' | 'INACTIVE' | 'ALL')}
            className={selectClassName}
          >
            <option value="ACTIVE">Только активные</option>
            <option value="INACTIVE">Только деактивированные</option>
            <option value="ALL">Все статусы</option>
          </select>
        </div>
        <div className="mezon-toolbar-group">
          <Button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Добавить пользователя
          </Button>
        </div>
      </PageToolbar>

      <DataTable
        title="Каталог учётных записей"
        description="Плотный реестр помогает быстро менять роль, отключать доступ и находить привязку к сотруднику без переходов между экранами."
        toolbar={
          <div className="mezon-kicker-list">
            <span className="mezon-data-table__toolbar-pill">Всего: {total}</span>
            <span className="mezon-data-table__toolbar-pill">Активные: {counts.active}</span>
            <span className="mezon-data-table__toolbar-pill">Деактивированные: {counts.inactive}</span>
          </div>
        }
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        density="compact"
        emptyState={
          loading ? (
            <LoadingCard message="Загружаем пользователей..." height={220} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={fetchData} className="py-10" />
          ) : (
            <EmptyListState
              title="Пользователи не найдены"
              description="Попробуйте изменить фильтры или создайте новую учётную запись."
              onAction={() => {
                setEditingUser(null);
                setIsModalOpen(true);
              }}
              actionLabel="Добавить пользователя"
              className="py-10"
            />
          )
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        eyebrow="Доступ и безопасность"
        description="Управляйте логином, ролью и связью с сотрудником в одном окне, чтобы поддерживать каталог учётных записей в актуальном состоянии."
        icon={<UserPlus className="h-5 w-5" />}
        size="xl"
        meta={
          editingUser ? (
            <span className="mezon-badge macos-badge-neutral">Редактирование</span>
          ) : (
            <span className="mezon-badge">Новая запись</span>
          )
        }
      >
        <UserForm
          initialData={editingUser}
          onSuccess={async () => {
            setIsModalOpen(false);
            await fetchData();
            toast.success(editingUser ? 'Пользователь обновлён' : 'Пользователь создан');
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Деактивировать пользователя"
        eyebrow="Опасное действие"
        description="Учётная запись будет отключена, но история действий и связь с сотрудником сохранятся."
        icon={<Trash2 className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!isDeleting}
        closeOnEscape={!isDeleting}
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={isDeleting}>
              {isDeleting ? 'Деактивация...' : 'Деактивировать'}
            </Button>
          </ModalActions>
        }
      >
        {deleteTarget ? (
          <>
            <ModalNotice title="Доступ будет остановлен" tone="danger">
              Пользователь больше не сможет входить в систему, но запись останется в истории и сможет быть восстановлена позже.
            </ModalNotice>

            <ModalSection title="Проверка учётной записи" description="Сверьте логин и сотрудника перед подтверждением.">
              <div className="mezon-modal-facts">
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Логин</span>
                  <span className="mezon-modal-fact__value">{deleteTarget.email}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Роль</span>
                  <span className="mezon-modal-fact__value">{ROLE_LABELS[deleteTarget.role]}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Сотрудник</span>
                  <span className="mezon-modal-fact__value">
                    {deleteTarget.employee
                      ? `${deleteTarget.employee.lastName} ${deleteTarget.employee.firstName}`
                      : 'Не привязан'}
                  </span>
                </div>
              </div>
            </ModalSection>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
