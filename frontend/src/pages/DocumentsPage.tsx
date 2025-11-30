import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, FileText, AlertTriangle } from 'lucide-react';
import { Document, DocumentTemplate } from '../types/document';
import { DocumentForm } from '../components/forms/DocumentForm';
import { DocumentTemplateForm } from '../components/forms/DocumentTemplateForm';
import { api } from '../lib/api';

export default function DocumentsPage() {
  const { data, total, page, setPage, fetchData } = useApi<Document>({
    url: '/api/documents',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'documents' | 'templates'>('documents');
  
  // Delete confirmation modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setIsModalOpen(true);
  };

  const openDeleteModal = (doc: Document) => {
    setDeletingDocument(doc);
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
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setIsTemplateModalOpen(false);
    fetchData();
    toast.success(editingDocument ? 'Документ обновлен' : 'Документ создан');
  };

  const documentsColumns: Column<Document>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Название' },
    { 
      key: 'template', 
      header: 'Шаблон', 
      render: (row) => row.template?.name || '—' 
    },
    {
      key: 'employee',
      header: 'Сотрудник',
      render: (row) => row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '—'
    },
    {
      key: 'child',
      header: 'Ребенок',
      render: (row) => row.child ? `${row.child.firstName} ${row.child.lastName}` : '—'
    },
    {
      key: 'createdAt',
      header: 'Создан',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU')
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEditDocument(row)}>
            Редактировать
          </Button>
          <a 
            href={row.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 px-3 text-sm rounded-md text-gray-800 hover:bg-gray-100"
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Управление документами</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'documents' ? 'default' : 'outline'}
            onClick={() => setViewMode('documents')}
          >
            <FileText className="mr-2 h-4 w-4" /> Документы
          </Button>
          <Button
            variant={viewMode === 'templates' ? 'default' : 'outline'}
            onClick={() => setViewMode('templates')}
          >
            Шаблоны
          </Button>
        </div>
      </div>

      {viewMode === 'documents' ? (
        <>
          <div className="mb-4 flex justify-end">
            <Button onClick={handleCreateDocument}>
              <PlusCircle className="mr-2 h-4 w-4" /> Добавить документ
            </Button>
          </div>
          <DataTable
            columns={documentsColumns}
            data={data}
            page={page}
            pageSize={10}
            total={total}
            onPageChange={setPage}
          />
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editingDocument ? 'Редактировать документ' : 'Новый документ'}
          >
            <DocumentForm
              initialData={editingDocument}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsModalOpen(false)}
            />
          </Modal>
          
          {/* Delete confirmation modal */}
          <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">Внимание!</h4>
                  <p className="text-red-700 text-sm mt-1">
                    Вы собираетесь удалить документ. Это действие нельзя отменить.
                  </p>
                </div>
              </div>
              {deletingDocument && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p><strong>Название:</strong> {deletingDocument.name}</p>
                  {deletingDocument.employee && (
                    <p><strong>Сотрудник:</strong> {deletingDocument.employee.firstName} {deletingDocument.employee.lastName}</p>
                  )}
                  {deletingDocument.child && (
                    <p><strong>Ребенок:</strong> {deletingDocument.child.firstName} {deletingDocument.child.lastName}</p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                  Отмена
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Удаление...' : 'Удалить'}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      ) : (
        <TemplatesView onTemplateCreated={handleFormSuccess} />
      )}
    </div>
  );
}

function TemplatesView({ onTemplateCreated }: { onTemplateCreated: () => void }) {
  const { data, total, page, setPage, fetchData } = useApi<DocumentTemplate>({
    url: '/api/documents/templates',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  
  // Delete confirmation modal
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
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    onTemplateCreated();
    toast.success(editingTemplate ? 'Шаблон обновлен' : 'Шаблон создан');
  };

  const columns: Column<DocumentTemplate>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Название' },
    {
      key: 'content',
      header: 'Описание',
      render: (row) => row.content.substring(0, 50) + '...'
    },
    {
      key: 'createdAt',
      header: 'Создан',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU')
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
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
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить шаблон
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
      />
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}
      >
        <DocumentTemplateForm
          initialData={editingTemplate}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
      
      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить шаблон документа. Это действие нельзя отменить.
                Документы, созданные по этому шаблону, не будут удалены.
              </p>
            </div>
          </div>
          {deletingTemplate && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Название:</strong> {deletingTemplate.name}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
