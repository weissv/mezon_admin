import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, Shield, Trash2, Edit, Settings, Check, X, Lock } from 'lucide-react';
import { UserForm } from '../components/forms/UserForm';
import { User } from '../types/user';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import type { UserRole, RolePermission } from '../types/auth';

const ROLE_LABELS: Record<string, string> = {
  DEVELOPER: 'Разработчик',
  DIRECTOR: 'Директор',
  DEPUTY: 'Завуч',
  ADMIN: 'Администратор',
  TEACHER: 'Учитель',
  ACCOUNTANT: 'Бухгалтер',
  ZAVHOZ: 'Завхоз',
};

const ROLE_COLORS: Record<string, string> = {
  DEVELOPER: 'bg-red-100 text-red-800',
  DIRECTOR: 'bg-purple-100 text-purple-800',
  DEPUTY: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-green-100 text-green-800',
  TEACHER: 'bg-yellow-100 text-yellow-800',
  ACCOUNTANT: 'bg-gray-100 text-gray-800',
  ZAVHOZ: 'bg-orange-100 text-orange-800',
};

const ALL_MODULES = [
  { id: "dashboard", label: "Дашборд" },
  { id: "children", label: "Дети" },
  { id: "employees", label: "Сотрудники" },
  { id: "schedule", label: "Расписание" },
  { id: "staffing", label: "Штатное расписание" },
  { id: "users", label: "Пользователи" },
  { id: "groups", label: "Классы" },
  { id: "clubs", label: "Кружки" },
  { id: "attendance", label: "Посещаемость" },
  { id: "finance", label: "Финансы" },
  { id: "inventory", label: "Склад" },
  { id: "menu", label: "Меню" },
  { id: "recipes", label: "Рецепты" },
  { id: "procurement", label: "Закупки" },
  { id: "maintenance", label: "Заявки" },
  { id: "security", label: "Безопасность" },
  { id: "documents", label: "Документы" },
  { id: "calendar", label: "Календарь" },
  { id: "feedback", label: "Обратная связь" },
  { id: "integration", label: "Импорт/Экспорт" },
  { id: "action-log", label: "Журнал действий" },
  { id: "notifications", label: "Уведомления" },
  { id: "ai-assistant", label: "ИИ-Методист" },
];

interface RolePermissionData {
  role: UserRole;
  isFullAccess: boolean;
  canBeEdited: boolean; // Может ли текущий пользователь редактировать эту роль
  modules: string[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  customPermissions?: Record<string, boolean>;
}

export default function UsersPage() {
  const { data, total, page, setPage, fetchData } = useApi<User>({
    url: '/api/users',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Permissions state
  const [permissions, setPermissions] = useState<RolePermissionData[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [editingPermission, setEditingPermission] = useState<RolePermissionData | null>(null);
  const [savingPermission, setSavingPermission] = useState(false);

  // Fetch permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const data = await api.get('/api/permissions');
      setPermissions(data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleSavePermission = async () => {
    if (!editingPermission) return;
    
    setSavingPermission(true);
    try {
      await api.put(`/api/permissions/${editingPermission.role}`, {
        modules: editingPermission.modules,
        canCreate: editingPermission.canCreate,
        canEdit: editingPermission.canEdit,
        canDelete: editingPermission.canDelete,
        canExport: editingPermission.canExport,
      });
      toast.success('Права сохранены');
      fetchPermissions();
      setEditingPermission(null);
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setSavingPermission(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    if (!editingPermission) return;
    const modules = editingPermission.modules.includes(moduleId)
      ? editingPermission.modules.filter(m => m !== moduleId)
      : [...editingPermission.modules, moduleId];
    setEditingPermission({ ...editingPermission, modules });
  };

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

      {/* Permissions Section */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Права доступа по ролям</h2>
        </div>

        <Card className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Настройте доступ к модулям системы для каждой роли. Разработчик может редактировать права любой роли без ограничений. Директор имеет полный доступ ко всем функциям.
          </p>
          
          {loadingPermissions ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Роль</th>
                    <th className="text-center py-3 px-2 font-medium">Модули</th>
                    <th className="text-center py-3 px-2 font-medium">Создание</th>
                    <th className="text-center py-3 px-2 font-medium">Редактирование</th>
                    <th className="text-center py-3 px-2 font-medium">Удаление</th>
                    <th className="text-center py-3 px-2 font-medium">Экспорт</th>
                    <th className="text-center py-3 px-2 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm) => (
                    <tr key={perm.role} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {perm.isFullAccess && <Lock className="h-4 w-4 text-amber-500" />}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[perm.role] || 'bg-gray-100'}`}>
                            {ROLE_LABELS[perm.role] || perm.role}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="text-gray-600">
                          {perm.isFullAccess ? 'Все' : `${perm.modules.length} / ${ALL_MODULES.length}`}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {perm.canCreate ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {perm.canEdit ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {perm.canDelete ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {perm.canExport ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {!perm.canBeEdited ? (
                          <span className="text-xs text-gray-400">Полный доступ</span>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setEditingPermission(perm)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Edit Permission Modal */}
      <Modal
        isOpen={!!editingPermission}
        onClose={() => setEditingPermission(null)}
        title={`Права для роли: ${editingPermission ? ROLE_LABELS[editingPermission.role] : ''}`}
      >
        {editingPermission && (
          <div className="space-y-6">
            {/* General permissions */}
            <div>
              <h3 className="font-medium mb-3">Общие права</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPermission.canCreate}
                    onChange={(e) => setEditingPermission({ ...editingPermission, canCreate: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Создание записей</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPermission.canEdit}
                    onChange={(e) => setEditingPermission({ ...editingPermission, canEdit: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Редактирование</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPermission.canDelete}
                    onChange={(e) => setEditingPermission({ ...editingPermission, canDelete: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Удаление записей</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPermission.canExport}
                    onChange={(e) => setEditingPermission({ ...editingPermission, canExport: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">Экспорт данных</span>
                </label>
              </div>
            </div>

            {/* Module access */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Доступ к модулям</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingPermission({ ...editingPermission, modules: ALL_MODULES.map(m => m.id) })}
                  >
                    Выбрать все
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingPermission({ ...editingPermission, modules: [] })}
                  >
                    Снять все
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                {ALL_MODULES.map((module) => (
                  <label key={module.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={editingPermission.modules.includes(module.id)}
                      onChange={() => toggleModule(module.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{module.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="ghost" onClick={() => setEditingPermission(null)} disabled={savingPermission}>
                Отмена
              </Button>
              <Button onClick={handleSavePermission} disabled={savingPermission}>
                {savingPermission ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
