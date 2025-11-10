import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, MessageCircle, CheckCircle } from 'lucide-react';
import { Feedback, FeedbackStatus } from '../types/feedback';
import { FeedbackForm } from '../components/forms/FeedbackForm';
import { FeedbackResponseForm } from '../components/forms/FeedbackResponseForm';
import { api } from '../lib/api';

export default function FeedbackPage() {
  const { data, total, page, setPage, fetchData } = useApi<Feedback>({
    url: '/api/feedback',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsResponseModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setIsResponseModalOpen(false);
    fetchData();
    toast.success('Обращение успешно обработано');
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    const styles = {
      NEW: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
    };
    const labels = {
      NEW: 'Новое',
      IN_PROGRESS: 'В работе',
      RESOLVED: 'Решено',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const columns: Column<Feedback>[] = [
    { key: 'id', header: 'ID' },
    {
      key: 'status',
      header: 'Статус',
      render: (row) => getStatusBadge(row.status)
    },
    { key: 'type', header: 'Тип' },
    { key: 'parentName', header: 'Родитель' },
    { key: 'contactInfo', header: 'Контакты' },
    { 
      key: 'message', 
      header: 'Сообщение',
      render: (row) => row.message.substring(0, 50) + (row.message.length > 50 ? '...' : '')
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
        <div className="flex gap-2">
          {row.status !== 'RESOLVED' && (
            <Button variant="outline" size="sm" onClick={() => handleRespond(row)}>
              Ответить
            </Button>
          )}
          {row.response && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedFeedback(row);
                alert(`Ответ: ${row.response}`);
              }}
            >
              Просмотр
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6" />
          Обратная связь
        </h1>
      </div>

      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить обращение
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
        title="Новое обращение"
      >
        <FeedbackForm
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Ответ на обращение"
      >
        {selectedFeedback && (
          <FeedbackResponseForm
            feedback={selectedFeedback}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsResponseModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
