// src/pages/ChildrenPage.tsx
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Search } from 'lucide-react';
import { api } from '../lib/api';
import { DataTable } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';
import { ChildForm } from '../components/forms/ChildForm';

type Child = { id: number; firstName: string; lastName: string; birthDate: string; group: { id: number; name: string }; healthInfo?: string; };

export default function ChildrenPage() {
  const [data, setData] = useState<Child[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '10', lastName: search });
      const response = await api.get(`/api/children?${params.toString()}`);
      setData(response.items);
      setTotal(response.total);
    } catch (error: any) {
      const msg = error?.message || error?.issues?.[0]?.message || 'Ошибка';
      toast.error('Ошибка загрузки данных', { description: msg });
    }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleCreate = () => { setEditingChild(null); setIsModalOpen(true); };
  const handleEdit = (child: Child) => { setEditingChild(child); setIsModalOpen(true); };
  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingChild ? 'Данные ребенка обновлены' : 'Ребенок успешно добавлен');
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'lastName', header: 'Фамилия' },
    { key: 'firstName', header: 'Имя' },
    { key: 'group', header: 'Группа', render: (row: Child) => row.group.name },
    { key: 'actions', header: 'Действия', render: (row: Child) => (<Button variant="outline" size="sm" onClick={() => handleEdit(row)}>Редактировать</Button>) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Управление контингентом детей</h1>
      <div className="mb-4 flex items-center justify-between">
        <div className="relative w-1/3">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input placeholder="Поиск по фамилии..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" /> Добавить ребенка</Button>
      </div>
      <DataTable columns={columns as any} data={data} page={page} pageSize={10} total={total} onPageChange={setPage} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingChild ? 'Редактировать данные' : 'Добавить нового ребенка'}>
        <ChildForm initialData={editingChild} onSuccess={handleFormSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
