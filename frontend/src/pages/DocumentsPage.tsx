import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, FileText } from 'lucide-react';
import { Document, DocumentTemplate } from '../types/document';
import { DocumentForm } from '../components/forms/DocumentForm';
import { DocumentTemplateForm } from '../components/forms/DocumentTemplateForm';

export default function DocumentsPage() {
  const { data, total, page, setPage, fetchData } = useApi<Document>({
    url: '/api/documents',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'documents' | 'templates'>('documents');

  const handleCreateDocument = () => {
    setEditingDocument(null);
    setIsModalOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setIsModalOpen(true);
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

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
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
        <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
          Редактировать
        </Button>
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
    </>
  );
}
