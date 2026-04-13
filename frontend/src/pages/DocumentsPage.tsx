import { useState } from 'react';
import { AlertTriangle, FileText, PlusCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Modal, ModalActions, ModalNotice, ModalSection } from '../components/Modal';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { DocumentForm } from '../components/forms/DocumentForm';
import { DocumentTemplateForm } from '../components/forms/DocumentTemplateForm';
import { EmptyListState, ErrorState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/input';
import { LoadingCard } from '../components/ui/LoadingState';
import { PageHeader, PageStack, PageToolbar } from '../components/ui/page';
import { Button } from '../components/ui/button';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { Document, DocumentTemplate } from '../types/document';

const TEMPLATE_CONTENT_PREVIEW_LENGTH = 80;

export default function DocumentsPage() {
  const [viewMode, setViewMode] = useState<'documents' | 'templates'>('documents');

  return (
    <PageStack>
      <PageHeader
        eyebrow="Документооборот"
        title="Документы"
        icon={<FileText className="h-5 w-5" />}
        meta={
          <span className="mezon-badge macos-badge-neutral">
            {viewMode === 'documents' ? 'Каталог документов' : 'Библиотека шаблонов'}
          </span>
        }
        description="Рабочее пространство для файлов и шаблонов стало плотнее и чище: поиск, создание и опасные действия собраны в единый паттерн, без лишних промежуточных карточек."
      />

      <PageToolbar>
        <div className="mezon-toolbar-group">
          <Button
            variant={viewMode === 'documents' ? 'default' : 'outline'}
            onClick={() => setViewMode('documents')}
          >
            <FileText className="h-4 w-4" />
            Документы
          </Button>
          <Button
            variant={viewMode === 'templates' ? 'default' : 'outline'}
            onClick={() => setViewMode('templates')}
          >
            Шаблоны
          </Button>
        </div>
      </PageToolbar>

      {viewMode === 'documents' ? <DocumentsCatalogView /> : <TemplatesView />}
    </PageStack>
  );
}

function DocumentsCatalogView() {
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
  } = useApi<Document>({
    url: '/api/documents',
    searchFields: ['name'],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setIsModalOpen(true);
  };

  const openDeleteModal = (document: Document) => {
    setDeletingDocument(document);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDocument) return;
    setDeleting(true);
    try {
      await api.delete(`/api/documents/${deletingDocument.id}`);
      toast.success('Документ удален');
      setDeleteModalOpen(false);
      setDeletingDocument(null);
      await fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = async () => {
    setIsModalOpen(false);
    await fetchData();
    toast.success(editingDocument ? 'Документ обновлен' : 'Документ создан');
  };

  const documentsColumns: Column<Document>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Название' },
    {
      key: 'template',
      header: 'Шаблон',
      render: (row) => row.template?.name || '—',
    },
    {
      key: 'employee',
      header: 'Сотрудник',
      render: (row) => (row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '—'),
    },
    {
      key: 'child',
      header: 'Ребёнок',
      render: (row) => (row.child ? `${row.child.firstName} ${row.child.lastName}` : '—'),
    },
    {
      key: 'createdAt',
      header: 'Создан',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU'),
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEditDocument(row)}>
            Редактировать
          </Button>
          <a
            href={row.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[28px] items-center justify-center rounded-[8px] border border-separator bg-surface-primary px-2.5 py-1 text-[12px] font-medium tracking-[-0.01em] text-text-primary shadow-subtle macos-transition hover:bg-fill-quaternary"
          >
            Скачать
          </a>
          <Button variant="destructive" size="sm" onClick={() => openDeleteModal(row)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageToolbar>
        <div className="mezon-toolbar-group">
          <div className="mezon-input-shell">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию документа"
              className="min-w-[280px]"
            />
          </div>
        </div>
        <div className="mezon-toolbar-group">
          <Button onClick={handleCreateDocument}>
            <PlusCircle className="h-4 w-4" />
            Добавить документ
          </Button>
        </div>
      </PageToolbar>

      <DataTable
        title="Каталог документов"
        description="Ищите файлы по названию, быстро проверяйте привязку к шаблону, сотруднику или ученику и выполняйте нужное действие прямо из списка."
        toolbar={<span className="mezon-data-table__toolbar-pill">Всего документов: {total}</span>}
        columns={documentsColumns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        density="compact"
        emptyState={
          loading ? (
            <LoadingCard message="Загружаем документы..." height={220} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={fetchData} className="py-10" />
          ) : (
            <EmptyListState
              title="Документы не найдены"
              description="Измените запрос или создайте новый документ, чтобы он появился в каталоге."
              onAction={handleCreateDocument}
              actionLabel="Добавить документ"
              className="py-10"
            />
          )
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDocument ? 'Редактировать документ' : 'Новый документ'}
        eyebrow="Документооборот"
        description="Заполните карточку документа так, чтобы его было легко найти по названию, файлу и привязке к сотруднику или ученику."
        icon={<FileText className="h-5 w-5" />}
        size="xl"
        meta={
          editingDocument ? (
            <span className="mezon-badge macos-badge-neutral">Редактирование</span>
          ) : (
            <span className="mezon-badge">Новый файл</span>
          )
        }
      >
        <DocumentForm
          initialData={editingDocument}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удаление документа"
        eyebrow="Опасное действие"
        description="Документ будет удалён без возможности восстановления. Перед подтверждением проверьте, что выбрали правильный файл."
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!deleting}
        closeOnEscape={!deleting}
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </ModalActions>
        }
      >
        <ModalNotice title="Удаление необратимо" tone="danger">
          Если документ уже использовался в работе сотрудников или связан с учеником, после удаления его придётся загружать заново.
        </ModalNotice>

        {deletingDocument ? (
          <ModalSection title="Проверка файла" description="Сверьте ключевые реквизиты перед удалением.">
            <div className="mezon-modal-facts">
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Название</span>
                <span className="mezon-modal-fact__value">{deletingDocument.name}</span>
              </div>
              {deletingDocument.employee ? (
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Сотрудник</span>
                  <span className="mezon-modal-fact__value">
                    {deletingDocument.employee.firstName} {deletingDocument.employee.lastName}
                  </span>
                </div>
              ) : null}
              {deletingDocument.child ? (
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Ученик</span>
                  <span className="mezon-modal-fact__value">
                    {deletingDocument.child.firstName} {deletingDocument.child.lastName}
                  </span>
                </div>
              ) : null}
            </div>
          </ModalSection>
        ) : null}
      </Modal>
    </div>
  );
}

function TemplatesView() {
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
  } = useApi<DocumentTemplate>({
    url: '/api/documents/templates',
    searchFields: ['name'],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<DocumentTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const openDeleteModal = (template: DocumentTemplate) => {
    setDeletingTemplate(template);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    setDeleting(true);
    try {
      await api.delete(`/api/documents/templates/${deletingTemplate.id}`);
      toast.success('Шаблон удален');
      setDeleteModalOpen(false);
      setDeletingTemplate(null);
      await fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSuccess = async () => {
    setIsModalOpen(false);
    await fetchData();
    toast.success(editingTemplate ? 'Шаблон обновлен' : 'Шаблон создан');
  };

  const columns: Column<DocumentTemplate>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Название' },
    {
      key: 'content',
      header: 'Описание',
      render: (row) =>
        row.content.length > TEMPLATE_CONTENT_PREVIEW_LENGTH
          ? `${row.content.slice(0, TEMPLATE_CONTENT_PREVIEW_LENGTH)}...`
          : row.content,
    },
    {
      key: 'createdAt',
      header: 'Создан',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU'),
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Редактировать
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openDeleteModal(row)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageToolbar>
        <div className="mezon-toolbar-group">
          <div className="mezon-input-shell">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию шаблона"
              className="min-w-[280px]"
            />
          </div>
        </div>
        <div className="mezon-toolbar-group">
          <Button onClick={handleCreate}>
            <PlusCircle className="h-4 w-4" />
            Добавить шаблон
          </Button>
        </div>
      </PageToolbar>

      <DataTable
        title="Библиотека шаблонов"
        description="Поддерживайте типовые шаблоны в одном каталоге, чтобы документы создавались быстрее и с единым стилем."
        toolbar={<span className="mezon-data-table__toolbar-pill">Всего шаблонов: {total}</span>}
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        density="compact"
        wrapCells
        emptyState={
          loading ? (
            <LoadingCard message="Загружаем шаблоны..." height={220} />
          ) : error ? (
            <ErrorState message={error.message} onRetry={fetchData} className="py-10" />
          ) : (
            <EmptyListState
              title="Шаблоны не найдены"
              description="Создайте первый шаблон, чтобы сотрудники могли быстро собирать типовые документы."
              onAction={handleCreate}
              actionLabel="Добавить шаблон"
              className="py-10"
            />
          )
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}
        eyebrow="Шаблоны"
        description="Подготовьте шаблон так, чтобы из него было удобно быстро создавать типовые документы без повторного ручного ввода."
        icon={<FileText className="h-5 w-5" />}
        size="xl"
        meta={
          editingTemplate ? (
            <span className="mezon-badge macos-badge-neutral">Редактирование</span>
          ) : (
            <span className="mezon-badge">Новый шаблон</span>
          )
        }
      >
        <DocumentTemplateForm
          initialData={editingTemplate}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удаление шаблона"
        eyebrow="Опасное действие"
        description="Шаблон будет удалён из каталога, но уже созданные по нему документы останутся. Подтвердите действие только после проверки названия."
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!deleting}
        closeOnEscape={!deleting}
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </ModalActions>
        }
      >
        <ModalNotice title="Что изменится после удаления" tone="danger">
          Шаблон исчезнет из каталога, поэтому новые документы по нему создать уже не получится. Ранее сформированные документы не будут затронуты.
        </ModalNotice>

        {deletingTemplate ? (
          <ModalSection title="Проверка шаблона" description="Убедитесь, что выбрали нужный шаблон из списка.">
            <div className="mezon-modal-facts">
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Название</span>
                <span className="mezon-modal-fact__value">{deletingTemplate.name}</span>
              </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Содержимое</span>
                  <span className="mezon-modal-fact__value">
                    {deletingTemplate.content.slice(0, TEMPLATE_CONTENT_PREVIEW_LENGTH)}
                    {deletingTemplate.content.length > TEMPLATE_CONTENT_PREVIEW_LENGTH ? '...' : ''}
                  </span>
                </div>
              </div>
          </ModalSection>
        ) : null}
      </Modal>
    </div>
  );
}
