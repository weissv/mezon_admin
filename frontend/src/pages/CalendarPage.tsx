import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, Calendar, Trash2, AlertTriangle, Grid, List, Share2 } from 'lucide-react';
import { Event } from '../types/calendar';
import { EventForm } from '../components/forms/EventForm';
import { api } from '../lib/api';
import { UkiyoeCalendar } from '../components/UkiyoeCalendar';
import { SocialPlanner } from '../components/SocialPlanner';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'planner'>('calendar');
  const { data, total, page, setPage, fetchData } = useApi<Event>({
    url: '/api/calendar',
    initialPageSize: 100, // Fetch more items for calendar view
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingEvent ? 'Событие обновлено' : 'Событие создано');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/calendar/${deleteConfirm.id}`);
      toast.success('Событие удалено');
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Event>[] = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Тема' },
    {
      key: 'date',
      header: 'Дата',
      render: (row) => new Date(row.date).toLocaleString('ru-RU', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      })
    },
    {
      key: 'group',
      header: 'Класс',
      render: (row) => row.group?.name || '—'
    },
    { key: 'organizer', header: 'Организатор' },
    {
      key: 'performers',
      header: 'Исполнители',
      render: (row) => row.performers?.length > 0 ? row.performers.join(', ') : '—'
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Редактировать
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDeleteConfirm(row)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Календарь событий
        </h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Календарь"
            >
                <Grid className="w-5 h-5" />
            </button>
            <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                title="Список"
            >
                <List className="w-5 h-5" />
            </button>
            <button
                onClick={() => setViewMode('planner')}
                className={`p-2 rounded-md transition-all ${viewMode === 'planner' ? 'bg-white shadow text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
                title="Планер для соцсетей"
            >
                <Share2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить событие
        </Button>
      </div>

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={data}
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
        />
      ) : viewMode === 'planner' ? (
        <div className="mb-8 overflow-x-auto">
          <SocialPlanner 
            events={data} 
            onEdit={handleEdit}
          />
        </div>
      ) : (
        <div className="mb-8">
            <UkiyoeCalendar 
                events={data} 
                onEdit={handleEdit} 
                onDelete={(event) => setDeleteConfirm(event)} 
            />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEvent ? 'Редактировать событие' : 'Новое событие'}
      >
        <EventForm
          initialData={editingEvent}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удаление события">
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Вы уверены, что хотите удалить это событие?</p>
              {deleteConfirm && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">{deleteConfirm.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(deleteConfirm.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">Это действие нельзя отменить.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
