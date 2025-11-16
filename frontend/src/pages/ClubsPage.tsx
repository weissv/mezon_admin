import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/input';
import { PlusCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useTranslation } from 'react-i18next';

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

export default function ClubsPage() {
  const { t } = useTranslation();
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

  const handleDelete = async (id: number) => {
    if (!confirm(t('clubs.confirmDelete'))) return;
    try {
      await api.delete('/api/clubs/' + id);
      toast.success(t('clubs.deleteClub'));
      fetchData();
    } catch (error: any) {
      toast.error(t('errors.genericError'), { description: error?.message });
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
        toast.success(t('clubs.editClub'));
      } else {
        await api.post('/api/clubs', payload);
        toast.success(t('clubs.addClub'));
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(t('errors.genericError'), { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Club>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: t('clubs.name') },
    { 
      key: 'teacher', 
      header: t('clubs.teacherId'),
      render: (row) => row.teacher.firstName + ' ' + row.teacher.lastName
    },
    { 
      key: 'cost', 
      header: t('clubs.price'),
      render: (row) => `${currency.format(row.cost)}/мес`
    },
    { key: 'maxStudents', header: t('clubs.maxChildren') },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            {t('common.edit')}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(row.id)}>
            {t('common.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('clubs.title')}</h1>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('clubs.addClub')}
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
        title={editingClub ? t('clubs.editClub') : t('clubs.addClub')}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('clubs.name')} *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={t('clubs.name')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('clubs.description')}</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('clubs.description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('clubs.teacherId')} *</label>
            <Input
              type="number"
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              required
              placeholder="1"
            />
          </div>

          <div>
              <label className="block text-sm font-medium mb-1">{t('clubs.price')} *</label>
            <Input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
              placeholder="1000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('clubs.maxChildren')} *</label>
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
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
