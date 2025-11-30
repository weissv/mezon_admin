import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, Shield, Trash2, Edit } from 'lucide-react';
import { UserForm } from '../components/forms/UserForm';
import { User } from '../types/user';
import { api } from '../lib/api';
import { Card } from '../components/Card';

const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: 'Директор',
  DEPUTY: 'Заместитель',
  ADMIN: 'Администратор',
  TEACHER: 'Педагог',
  ACCOUNTANT: 'Бухгалтер',
};

const ROLE_COLORS: Record<string, string> = {
  DIRECTOR: 'bg-purple-100 text-purple-800',
  DEPUTY: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-green-100 text-green-800',
  TEACHER: 'bg-yellow-100 text-yellow-800',
  ACCOUNTANT: 'bg-gray-100 text-gray-800',
};

export default function UsersPage() {
  const { data, total, page, setPage, fetchData } = useApi<User>({
    url: '/api/users',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingUser ? 'Пользователь обновлён' : 'Пользователь успешно создан');
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/users/${userToDelete.id}`);
      toast.success('Пользователь удалён');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<User>[] = [
    { key: 'id', header: 'ID' },
    { key: 'email', header: 'Логин' },
    {
      key: 'role',
      header: 'Роль',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[row.role] || 'bg-gray-100'}`}>
          {ROLE_LABELS[row.role] || row.role}
        </span>
      ),
    },
    {
      key: 'employee',
      header: 'Сотрудник',
      render: (row) => row.employee ? `${row.employee.lastName} ${row.employee.firstName}` : '—',
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Управление доступом к системе</p>
            <p className="text-sm text-gray-600">
              Создавайте учётные записи для сотрудников и назначайте им роли для работы в ERP.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить пользователя
          </Button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
      >
        <UserForm
          initialData={editingUser}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Удалить пользователя?"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Вы уверены, что хотите удалить пользователя{' '}
            <span className="font-semibold">{userToDelete?.email}</span>?
          </p>
          <p className="text-sm text-gray-500">
            Сотрудник останется в системе, но потеряет доступ к ERP.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
