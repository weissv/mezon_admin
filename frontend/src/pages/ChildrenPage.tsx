// src/pages/ChildrenPage.tsx
import { useState } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Search } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';
import { ChildForm } from '../components/forms/ChildForm';
import { Child } from '../types/child';

export default function ChildrenPage() {
  const { data, total, page, search, setPage, setSearch, fetchData } = useApi<Child>({
    url: '/api/children',
    searchFields: ['lastName'],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const handleCreate = () => {
    setEditingChild(null);
    setIsModalOpen(true);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingChild ? 'Данные ребенка обновлены' : 'Ребенок успешно добавлен');
  };

  const columns: Column<Child>[] = [
    { key: 'id', header: 'ID' },
    { key: 'lastName', header: 'Фамилия' },
    { key: 'firstName', header: 'Имя' },
    { key: 'group', header: 'Группа', render: (row) => row.group.name },
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
    <div>
      <h1 className="text-2xl font-bold mb-4">Управление контингентом детей</h1>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-1/3">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input
            placeholder="Поиск по фамилии..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить ребенка
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
        title={editingChild ? 'Редактировать данные' : 'Добавить нового ребенка'}
      >
        <ChildForm
          initialData={editingChild}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
