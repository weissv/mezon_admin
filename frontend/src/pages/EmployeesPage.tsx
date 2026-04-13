import { useEffect, useState } from 'react';
import { AlertCircle, Download, PlusCircle, Search, Trash2, UploadCloud, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Modal, ModalActions, ModalNotice, ModalSection } from '../components/Modal';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { EmptyListState, ErrorState } from '../components/ui/EmptyState';
import { EmployeeForm } from '../components/forms/EmployeeForm';
import { Input } from '../components/ui/input';
import { LoadingCard } from '../components/ui/LoadingState';
import { PageHeader, PageSection, PageStack, PageToolbar } from '../components/ui/page';
import { Button } from '../components/ui/button';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { Employee, EmployeeReminders } from '../types/employee';

export default function EmployeesPage() {
  const {
    data,
    total,
    page,
    setPage,
    fetchData,
    loading,
    error,
    search,
    setSearch,
  } = useApi<Employee>({
    url: '/api/employees',
    searchFields: ['firstName', 'lastName', 'position'],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [reminders, setReminders] = useState<EmployeeReminders | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await api.get('/api/employees/reminders');
      setReminders(data);
    } catch {
      setReminders(null);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleFormSuccess = async () => {
    setIsModalOpen(false);
    await fetchData();
    await loadReminders();
    toast.success(editingEmployee ? 'Данные сотрудника обновлены' : 'Сотрудник успешно добавлен');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/employees/${deleteConfirm.id}`);
      toast.success('Сотрудник удалён');
      setDeleteConfirm(null);
      await fetchData();
      await loadReminders();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEmployeesExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.download('/api/integration/export/excel/employees');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `employees-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Шаблон с сотрудниками выгружен');
    } catch (error: any) {
      toast.error('Не удалось скачать шаблон', { description: error?.message });
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<Employee>[] = [
    { key: 'id', header: 'ID' },
    { key: 'lastName', header: 'Фамилия' },
    { key: 'firstName', header: 'Имя' },
    {
      key: 'birthDate',
      header: 'Дата рождения',
      render: (row) => (row.birthDate ? new Date(row.birthDate).toLocaleDateString('ru-RU') : '—'),
    },
    { key: 'position', header: 'Должность' },
    { key: 'rate', header: 'Ставка' },
    {
      key: 'user',
      header: 'Аккаунт',
      render: (row) =>
        row.user ? (
          <span className="text-macos-green">{row.user.email}</span>
        ) : (
          <span className="text-tertiary">Нет</span>
        ),
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Редактировать
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirm(row)}
            aria-label={`Удалить сотрудника ${row.lastName} ${row.firstName}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const hasReminders = Boolean(
    reminders && (reminders.medicalCheckups.length > 0 || reminders.attestations.length > 0),
  );

  return (
    <PageStack>
      <PageHeader
        eyebrow="HR · каталог"
        title="Сотрудники"
        icon={<Users className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral">{total} записей</span>}
        description="Единый список сотрудников, кадровых ролей и связанных аккаунтов. Основные действия собраны в плотный операторский экран без лишних промежуточных карточек."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/integration#employees')}>
              <UploadCloud className="h-4 w-4" />
              Импорт
            </Button>
            <Button onClick={handleCreate}>
              <PlusCircle className="h-4 w-4" />
              Добавить сотрудника
            </Button>
          </>
        }
      />

      <PageToolbar>
        <div className="mezon-toolbar-group">
          <div className="mezon-input-shell">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по фамилии, имени или должности"
              className="min-w-[280px]"
            />
          </div>
        </div>
        <div className="mezon-toolbar-group">
          <Button variant="outline" onClick={handleEmployeesExport} disabled={isExporting}>
            <Download className="h-4 w-4" />
            {isExporting ? 'Готовим...' : 'Шаблон Excel'}
          </Button>
        </div>
      </PageToolbar>

      {hasReminders ? (
        <PageSection inset>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,149,0,0.14)] text-macos-orange">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-macos-orange">Кадровые сигналы</p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-primary">Напоминания по срокам</h2>
              </div>

              {reminders?.medicalCheckups.length ? (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-primary">
                    Медосмотры ({reminders.medicalCheckups.length})
                  </p>
                  <ul className="space-y-1.5 text-[14px] leading-relaxed text-secondary">
                    {reminders.medicalCheckups.map((employee) => (
                      <li key={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.position}) — через {employee.daysUntil} дн.
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {reminders?.attestations.length ? (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-primary">
                    Аттестации ({reminders.attestations.length})
                  </p>
                  <ul className="space-y-1.5 text-[14px] leading-relaxed text-secondary">
                    {reminders.attestations.map((employee) => (
                      <li key={employee.id}>
                        {employee.firstName} {employee.lastName} ({employee.position}) — через {employee.daysUntil} дн.
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </PageSection>
      ) : null}

      <DataTable
        title="Штат и аккаунты"
        description="Плотный список помогает быстро находить сотрудника, видеть роль и переходить к редактированию без дополнительной навигации."
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        density="compact"
        emptyState={
          loading ? (
            <LoadingCard message="Загружаем штат..." height={220} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={fetchData} className="py-10" />
          ) : (
            <EmptyListState
              title="Сотрудники не найдены"
              description="Измените запрос поиска или создайте первую карточку сотрудника."
              onAction={handleCreate}
              actionLabel="Добавить сотрудника"
              className="py-10"
            />
          )
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Редактировать сотрудника' : 'Новый сотрудник'}
        eyebrow="HR · карточка сотрудника"
        description="Соберите персональные и кадровые данные в одном окне, чтобы не возвращаться к записи несколько раз."
        icon={<Users className="h-5 w-5" />}
        size="xl"
        meta={
          editingEmployee ? (
            <span className="mezon-badge macos-badge-neutral">Редактирование</span>
          ) : (
            <span className="mezon-badge">Новая запись</span>
          )
        }
      >
        <EmployeeForm
          initialData={editingEmployee}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление сотрудника"
        eyebrow="Опасное действие"
        description="Карточка сотрудника будет удалена без возможности восстановления. Перед подтверждением проверьте привязанный аккаунт и должность."
        icon={<AlertCircle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!isDeleting}
        closeOnEscape={!isDeleting}
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </ModalActions>
        }
      >
        {deleteConfirm ? (
          <>
            <ModalNotice title="Удаление необратимо" tone="danger">
              Если сотрудник связан с учётной записью, она тоже будет удалена. Проверьте запись перед подтверждением.
            </ModalNotice>

            <ModalSection title="Проверка карточки" description="Сверьте основные реквизиты, чтобы не удалить не того сотрудника.">
              <div className="mezon-modal-facts">
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Сотрудник</span>
                  <span className="mezon-modal-fact__value">
                    {deleteConfirm.lastName} {deleteConfirm.firstName}
                  </span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Должность</span>
                  <span className="mezon-modal-fact__value">{deleteConfirm.position}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Аккаунт</span>
                  <span className="mezon-modal-fact__value">{deleteConfirm.user?.email ?? 'Не привязан'}</span>
                </div>
              </div>
            </ModalSection>
          </>
        ) : null}
      </Modal>
    </PageStack>
  );
}
