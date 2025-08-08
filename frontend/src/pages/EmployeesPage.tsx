import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { DataTable } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle } from 'lucide-react';
import { EmployeeForm } from '../components/forms/EmployeeForm';

type Employee = { id: number; firstName: string; lastName: string; position: string; rate: number; hireDate: string; branch: { id: number; name: string } };

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '10' });
      const response = await api.get(`/api/employees?${params.toString()}`);
      setData(response.items);
      setTotal(response.total);
    } catch (error: any) {
      toast.error('Ошибка загрузки данных', { description: error?.message });
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleCreate = () => { setEditingEmployee(null); setIsModalOpen(true); };
  const handleEdit = (employee: Employee) => { setEditingEmployee(employee); setIsModalOpen(true); };
  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingEmployee ? 'Данные сотрудника обновлены' : 'Сотрудник успешно добавлен');
  };

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'lastName', header: 'Фамилия' },
    { key: 'firstName', header: 'Имя' },
    { key: 'position', header: 'Должность' },
    { key: 'branch', header: 'Филиал', render: (row: Employee) => row.branch.name },
    { key: 'actions', header: 'Действия', render: (row: Employee) => (<Button variant="outline" size="sm" onClick={() => handleEdit(row)}>Редактировать</Button>) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Управление сотрудниками</h1>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}><PlusCircle className="mr-2 h-4 w-4" /> Добавить сотрудника</Button>
      </div>
      <DataTable columns={columns as any} data={data} page={page} pageSize={10} total={total} onPageChange={setPage} />
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingEmployee ? 'Редактировать данные' : 'Добавить нового сотрудника'}>
        <EmployeeForm initialData={editingEmployee} onSuccess={handleFormSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}