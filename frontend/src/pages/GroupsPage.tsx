// src/pages/GroupsPage.tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Edit, Users, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';

interface Group {
  id: number;
  name: string;
  _count?: {
    children: number;
  };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const groupsData = await api.get('/api/groups');
      setGroups(groupsData || []);
    } catch (error: any) {
      toast.error('Ошибка загрузки данных', { description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = () => {
    setEditingGroup(null);
    setFormName('');
    setIsModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormName(group.name);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Заполните название');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
      };

      if (editingGroup) {
        await api.put(`/api/groups/${editingGroup.id}`, payload);
        toast.success('Класс обновлён');
      } else {
        await api.post('/api/groups', payload);
        toast.success('Класс создан');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/groups/${deleteConfirm.id}`);
      toast.success('Класс удалён');
      setDeleteConfirm(null);
      loadData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка классов...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Управление классами</h1>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить класс
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          Классы не найдены. Добавьте первый класс.
        </Card>
      ) : (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div>
                  <p className="font-medium">{group.name}</p>
                  {group._count && (
                    <p className="text-xs text-gray-500">
                      {group._count.children} детей
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(group)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(group)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? 'Редактировать класс' : 'Новый класс'}
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 font-medium">
              Название класса
            </label>
            <Input
              id="name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Например: 1А класс"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление класса"
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                Вы уверены, что хотите удалить этот класс?
              </p>
              {deleteConfirm && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">{deleteConfirm.name}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Это действие нельзя отменить. Все дети из этого класса останутся
                без привязки к классу.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
