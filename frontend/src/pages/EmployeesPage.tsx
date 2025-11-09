import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle } from 'lucide-react';
import { EmployeeForm } from '../components/forms/EmployeeForm';
import { Employee } from '../types/employee';

export default function EmployeesPage() {
  const { data, total, page, setPage, fetchData } = useApi<Employee>({
    url: '/api/employees',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingEmployee ? 'Данные сотрудника обновлены' : 'Сотрудник успешно добавлен');
  };

  const columns: Column<Employee>[] = [
    { key: 'id', header: 'ID' },
    { key: 'lastName', header: 'Фамилия' },
    { key: 'firstName', header: 'Имя' },
    { key: 'position', header: 'Должность' },
    { key: 'branch', header: 'Филиал', render: (row) => row.branch.name },
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
      <h1 className="text-2xl font-bold mb-4">Управление сотрудниками</h1>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить сотрудника
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
        title={editingEmployee ? 'Редактировать данные' : 'Добавить нового сотрудника'}
      >
        <EmployeeForm
          initialData={editingEmployee}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}