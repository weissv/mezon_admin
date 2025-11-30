import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/input';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

interface Club {
  id: number;
  name: string;
  description?: string | null;
  teacherId: number;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
  cost: number;
  maxStudents: number;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}

export default function ClubsPage() {
  const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });
  const { data: clubs, total, page, setPage, fetchData } = useApi<Club>({
    url: '/api/clubs',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacherId: '',
    cost: '',
    maxStudents: ''
  });
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClub, setDeletingClub] = useState<Club | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка списка педагогов при монтировании
  useEffect(() => {
    setIsLoadingTeachers(true);
    api.get('/api/employees?pageSize=200')
      .then((data: any) => {
        const items = data.items || data || [];
        setTeachers(items);
      })
      .catch((error: any) => {
        toast.error('Не удалось загрузить список педагогов', { description: error?.message });
      })
      .finally(() => setIsLoadingTeachers(false));
  }, []);

  const handleCreate = () => {
    setEditingClub(null);
    setFormData({
      name: '',
      description: '',
      teacherId: '',
      cost: '',
      maxStudents: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description || '',
      teacherId: String(club.teacherId),
      cost: String(club.cost),
      maxStudents: String(club.maxStudents)
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (club: Club) => {
    setDeletingClub(club);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingClub) return;
    setDeleting(true);
    try {
      await api.delete('/api/clubs/' + deletingClub.id);
      toast.success('Кружок удален');
      setDeleteModalOpen(false);
      setDeletingClub(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        teacherId: parseInt(formData.teacherId),
        cost: parseFloat(formData.cost),
        maxStudents: parseInt(formData.maxStudents)
      };

      if (editingClub) {
        await api.put('/api/clubs/' + editingClub.id, payload);
        toast.success('Кружок обновлен');
      } else {
        await api.post('/api/clubs', payload);
        toast.success('Кружок создан');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Club>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Название' },
    { 
      key: 'teacher', 
      header: 'Педагог',
      render: (row) => row.teacher.firstName + ' ' + row.teacher.lastName
    },
    { 
      key: 'cost', 
      header: 'Стоимость',
      render: (row) => `${currency.format(row.cost)}/мес`
    },
    { key: 'maxStudents', header: 'Макс. детей' },
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Кружки и секции</h1>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить кружок
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={clubs}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClub ? 'Редактировать кружок' : 'Новый кружок'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Рисование"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Творческое развитие детей"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Педагог *</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              required
              disabled={isLoadingTeachers}
            >
              <option value="">{isLoadingTeachers ? 'Загружаем...' : 'Выберите педагога'}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.lastName} {teacher.firstName} — {teacher.position}
                </option>
              ))}
            </select>
          </div>

          <div>
              <label className="block text-sm font-medium mb-1">Стоимость (UZS/мес) *</label>
            <Input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
              placeholder="1000000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Максимум детей *</label>
            <Input
              type="number"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
              required
              placeholder="15"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить кружок. Это действие нельзя отменить. 
                Все записи детей в этот кружок также будут удалены.
              </p>
            </div>
          </div>
          {deletingClub && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Название:</strong> {deletingClub.name}</p>
              <p><strong>Педагог:</strong> {deletingClub.teacher.firstName} {deletingClub.teacher.lastName}</p>
              <p><strong>Стоимость:</strong> {currency.format(deletingClub.cost)}/мес</p>
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
    </div>
  );
}
