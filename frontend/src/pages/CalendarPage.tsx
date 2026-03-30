import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, Calendar, Trash2, AlertTriangle, Grid, List, Share2 } from 'lucide-react';
import type { CalendarEvent } from '../types/calendar';
import { EventForm } from '../components/forms/EventForm';
import { UkiyoeCalendar } from '../components/UkiyoeCalendar';
import { SocialPlanner } from '../components/SocialPlanner';
import { useCalendar } from '../features/calendar';

const LIST_PAGE_SIZE = 10;

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'planner'>('calendar');
  const [listPage, setListPage] = useState(1);

  const {
    events,
    loading,
    editingEvent,
    deleteTarget,
    isDeleting,
    isModalOpen,
    refresh,
    openCreate,
    openEdit,
    closeModal,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useCalendar();

  const handleFormSuccess = () => {
    closeModal();
    refresh();
    toast.success(editingEvent ? 'Событие обновлено' : 'Событие создано');
  };

  const columns: Column<CalendarEvent>[] = [
    { key: 'id', header: 'ID' },
    { key: 'title', header: 'Тема' },
    {
      key: 'date',
      header: 'Дата',
      render: (row) =>
        new Date(row.date).toLocaleString('ru-RU', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
    },
    {
      key: 'group',
      header: 'Класс',
      render: (row) => row.group?.name || '—',
    },
    { key: 'organizer', header: 'Организатор' },
    {
      key: 'performers',
      header: 'Исполнители',
      render: (row) => (row.performers?.length > 0 ? row.performers.join(', ') : '—'),
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
            Редактировать
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestDelete(row)}
            className="text-macos-red hover:text-macos-red hover:bg-[rgba(255,59,48,0.06)]"
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
        <h1 className="text-[24px] font-bold tracking-[-0.025em] leading-tight flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Календарь событий
        </h1>
        <div className="flex bg-fill-tertiary p-1 rounded-lg">
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-md macos-transition ${viewMode === 'calendar' ? 'bg-white shadow text-macos-blue' : 'text-secondary hover:text-primary'}`}
            title="Календарь"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md macos-transition ${viewMode === 'list' ? 'bg-white shadow text-macos-blue' : 'text-secondary hover:text-primary'}`}
            title="Список"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('planner')}
            className={`p-2 rounded-md macos-transition ${viewMode === 'planner' ? 'bg-white shadow text-pink-500' : 'text-secondary hover:text-primary'}`}
            title="Планер для соцсетей"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate} disabled={loading}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить событие
        </Button>
      </div>

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={events.slice((listPage - 1) * LIST_PAGE_SIZE, listPage * LIST_PAGE_SIZE)}
          page={listPage}
          pageSize={LIST_PAGE_SIZE}
          total={events.length}
          onPageChange={setListPage}
          wrapCells
        />
      ) : viewMode === 'planner' ? (
        <div className="mb-8 overflow-x-auto">
          <SocialPlanner events={events} onEdit={openEdit} />
        </div>
      ) : (
        <div className="mb-8">
          <UkiyoeCalendar events={events} onEdit={openEdit} onDelete={requestDelete} />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEvent ? 'Редактировать событие' : 'Новое событие'}
      >
        <EventForm
          initialData={editingEvent}
          onSuccess={handleFormSuccess}
          onCancel={closeModal}
        />
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={cancelDelete} title="Удаление события">
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[rgba(255,59,48,0.12)] rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-macos-red" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-primary">Вы уверены, что хотите удалить это событие?</p>
              {deleteTarget && (
                <div className="mt-2 p-3 bg-fill-quaternary rounded-md">
                  <p className="text-[11px] font-medium uppercase tracking-widest">{deleteTarget.title}</p>
                  <p className="text-xs text-secondary mt-1">
                    {new Date(deleteTarget.date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
              <p className="text-sm text-secondary mt-2">Это действие нельзя отменить.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
