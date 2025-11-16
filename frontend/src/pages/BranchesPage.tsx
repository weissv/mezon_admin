import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/input';
import { PlusCircle, MapPin } from 'lucide-react';
import { api } from '../lib/api';

interface Branch {
  id: number;
  name: string;
  address: string;
  phone?: string;
}

export default function BranchesPage() {
  const { data: branches, fetchData } = useApi<Branch>({ url: '/api/branches' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/branches', formData);
      toast.success('Филиал добавлен');
      setIsModalOpen(false);
      setFormData({ name: '', address: '', phone: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка создания филиала', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Филиалы</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить филиал
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <div className="p-4">
              <div className="flex items-start mb-2">
                <MapPin className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <h2 className="font-bold text-lg">{branch.name}</h2>
              </div>
              <p className="text-sm text-gray-600 ml-7">{branch.address}</p>
              {branch.phone && (
                <p className="text-sm text-gray-500 ml-7 mt-1">
                  Телефон: {branch.phone}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {branches.length === 0 && (
        <Card>
          <div className="p-8 text-center text-gray-500">
            Нет филиалов. Добавьте первый филиал.
          </div>
        </Card>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Добавить филиал"
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Филиал №1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Адрес *</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="ул. Примерная, д. 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <div className="flex gap-2 justify-end">
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
    </div>
  );
}