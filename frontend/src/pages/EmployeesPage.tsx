import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { EmployeeForm } from '../components/forms/EmployeeForm';
import { Employee } from '../types/employee';
import { api } from '../lib/api';
import { Card } from '../components/Card';

export default function EmployeesPage() {
  const { data, total, page, setPage, fetchData } = useApi<Employee>({
    url: '/api/employees',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [reminders, setReminders] = useState<any>(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await api.get('/api/employees/reminders');
      setReminders(data);
    } catch (error: any) {
      console.error('Failed to load reminders:', error);
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

      {/* Reminders Widget */}
      {reminders && (reminders.medicalCheckups.length > 0 || reminders.attestations.length > 0) && (
        <Card className="mb-6 p-4 bg-orange-50 border-orange-200">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">Напоминания</h3>
              
              {reminders.medicalCheckups.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    Медосмотры ({reminders.medicalCheckups.length}):
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {reminders.medicalCheckups.map((emp: any) => (
                      <li key={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.position}) - через {emp.daysUntil} дн.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reminders.attestations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    Аттестации ({reminders.attestations.length}):
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {reminders.attestations.map((emp: any) => (
                      <li key={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.position}) - через {emp.daysUntil} дн.
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

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