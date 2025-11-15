// src/pages/ChildrenPage.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Search, CalendarX } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';
import { ChildForm } from '../components/forms/ChildForm';
import { Child } from '../types/child';
import { api } from '../lib/api';

export default function ChildrenPage() {
  const { data, total, page, search, setPage, setSearch, fetchData } = useApi<Child>({
    url: '/api/children',
    searchFields: ['lastName'],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showAbsences, setShowAbsences] = useState(false);

  const handleCreate = () => {
    setEditingChild(null);
    setIsModalOpen(true);
  };

  const handleEdit = (child: Child) => {
    setEditingChild(child);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingChild ? 'Данные ребенка обновлены' : 'Ребенок успешно добавлен');
  };

  const handleViewAbsences = (child: Child) => {
    setSelectedChild(child);
    setShowAbsences(true);
  };

  const columns: Column<Child>[] = [
    { key: 'id', header: 'ID' },
    { key: 'lastName', header: 'Фамилия' },
    { key: 'firstName', header: 'Имя' },
    { key: 'group', header: 'Группа', render: (row) => row.group.name },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Редактировать
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleViewAbsences(row)}>
            <CalendarX className="h-4 w-4 mr-1" /> Отсутствия
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Управление контингентом детей</h1>
      <div className="mb-4 mobile-stack">
        <div className="search-container">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input
            placeholder="Поиск по фамилии..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить ребенка
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
        title={editingChild ? 'Редактировать данные' : 'Добавить нового ребенка'}
      >
        <ChildForm
          initialData={editingChild}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Absences Modal */}
      <Modal
        isOpen={showAbsences}
        onClose={() => setShowAbsences(false)}
        title={`Отсутствия - ${selectedChild?.firstName} ${selectedChild?.lastName}`}
      >
        {selectedChild && <AbsencesView childId={selectedChild.id} />}
      </Modal>
    </div>
  );
}

function AbsencesView({ childId }: { childId: number }) {
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/children/${childId}/absences`);
      setAbsences(data);
    } catch (error: any) {
      toast.error('Ошибка загрузки отсутствий', { description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAbsences();
  }, [childId]);

  const handleAddAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/children/${childId}/absences`, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
      });
      toast.success('Отсутствие добавлено');
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      loadAbsences();
    } catch (error: any) {
      toast.error('Ошибка добавления', { description: error?.message });
    }
  };

  const handleDelete = async (absenceId: number) => {
    if (!confirm('Удалить запись об отсутствии?')) return;
    try {
      await api.delete(`/api/children/absences/${absenceId}`);
      toast.success('Отсутствие удалено');
      loadAbsences();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    }
  };

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить отсутствие
        </Button>
      ) : (
        <form onSubmit={handleAddAbsence} className="border p-4 rounded space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Дата начала</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дата окончания</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Причина</label>
            <Input 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder="Семейный отпуск" 
              required 
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Сохранить</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Отмена
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {absences.length === 0 ? (
          <p className="text-gray-500 text-sm">Нет записей об отсутствиях</p>
        ) : (
          absences.map((absence) => (
            <div key={absence.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <div className="font-medium">
                  {new Date(absence.startDate).toLocaleDateString('ru-RU')} - {new Date(absence.endDate).toLocaleDateString('ru-RU')}
                </div>
                <div className="text-sm text-gray-600">{absence.reason}</div>
              </div>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDelete(absence.id)}
              >
                Удалить
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
