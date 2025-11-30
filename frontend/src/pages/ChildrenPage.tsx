// src/pages/ChildrenPage.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Search, CalendarX, UploadCloud, Download, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';
import { ChildForm } from '../components/forms/ChildForm';
import { Child } from '../types/child';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { useNavigate } from 'react-router-dom';

export default function ChildrenPage() {
  const { data, total, page, search, setPage, setSearch, fetchData } = useApi<Child>({
    url: '/api/children',
    searchFields: ['lastName'],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showAbsences, setShowAbsences] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleCreate = () => {
    setEditingChild(null);
    setIsModalOpen(true);
  };

  const handleChildrenExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.download('/api/integration/export/excel/children');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `children-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Шаблон с детьми выгружен');
    } catch (error: any) {
      toast.error('Не удалось скачать шаблон', { description: error?.message });
    } finally {
      setIsExporting(false);
    }
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

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/children/${deleteConfirm.id}`);
      toast.success('Ученик удалён');
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Child>[] = [
    { key: 'id', header: 'ID' },
    { key: 'lastName', header: 'Фамилия' },
    { key: 'firstName', header: 'Имя' },
    { key: 'group', header: 'Класс', render: (row) => row.group.name },
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
          <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Управление контингентом детей</h1>

      <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Массовая загрузка списков</p>
          <p className="text-sm text-gray-600">Импортируйте детей из Excel/Google Sheets или выгрузите актуальный шаблон для кураторов.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleChildrenExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" /> {isExporting ? 'Готовим...' : 'Шаблон Excel'}
          </Button>
          <Button onClick={() => navigate('/integration#children')}>
            <UploadCloud className="mr-2 h-4 w-4" /> Перейти к импорту
          </Button>
        </div>
      </Card>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление ученика"
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Вы уверены, что хотите удалить ученика?</p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>{deleteConfirm?.lastName} {deleteConfirm?.firstName}</strong> ({deleteConfirm?.group?.name})
              </p>
              <p className="text-sm text-red-600 mt-2">
                Это действие нельзя отменить! Все связанные данные (посещаемость, отсутствия, записи в кружки) будут удалены.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
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

function AbsencesView({ childId }: { childId: number }) {
  const [absences, setAbsences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [deleteAbsenceConfirm, setDeleteAbsenceConfirm] = useState<any>(null);
  const [isDeletingAbsence, setIsDeletingAbsence] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteAbsenceConfirm) return;
    setIsDeletingAbsence(true);
    try {
      await api.delete(`/api/children/absences/${deleteAbsenceConfirm.id}`);
      toast.success('Отсутствие удалено');
      setDeleteAbsenceConfirm(null);
      loadAbsences();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeletingAbsence(false);
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
                onClick={() => setDeleteAbsenceConfirm(absence)}
              >
                Удалить
              </Button>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={!!deleteAbsenceConfirm} onClose={() => setDeleteAbsenceConfirm(null)} title="Удаление отсутствия">
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Вы уверены, что хотите удалить эту запись об отсутствии?</p>
              {deleteAbsenceConfirm && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">
                    {new Date(deleteAbsenceConfirm.startDate).toLocaleDateString('ru-RU')} - {new Date(deleteAbsenceConfirm.endDate).toLocaleDateString('ru-RU')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{deleteAbsenceConfirm.reason}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">Это действие нельзя отменить.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setDeleteAbsenceConfirm(null)} disabled={isDeletingAbsence}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeletingAbsence}>
              {isDeletingAbsence ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
