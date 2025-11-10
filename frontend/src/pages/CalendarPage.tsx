import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, Calendar } from 'lucide-react';
import { Event } from '../types/calendar';
import { EventForm } from '../components/forms/EventForm';

export default function CalendarPage() {
  const { data, total, page, setPage, fetchData } = useApi<Event>({
    url: '/api/calendar',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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

  const columns: Column<Event>[] = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Название' },
    { 
      key: 'description', 
      header: 'Описание',
      render: (row) => row.description.substring(0, 60) + (row.description.length > 60 ? '...' : '')
    },
    {
      key: 'date',
      header: 'Дата',
      render: (row) => new Date(row.date).toLocaleString('ru-RU', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      })
    },
    {
      key: 'createdAt',
      header: 'Создано',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ru-RU')
    },
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Календарь событий
        </h1>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить событие
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
        title={editingEvent ? 'Редактировать событие' : 'Новое событие'}
      >
        <EventForm
          initialData={editingEvent}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
