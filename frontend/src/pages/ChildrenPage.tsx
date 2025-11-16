// src/pages/ChildrenPage.tsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Search, CalendarX, UploadCloud, Download } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';

export default function ChildrenPage() {
  const { t } = useTranslation(['children', 'common']);
  const { data, total, page, search, setPage, setSearch, fetchData } = useApi<Child>({
    url: '/api/children',
    searchFields: ['lastName'],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showAbsences, setShowAbsences] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
      toast.success(t('massUpload.templateDownloaded'));
    } catch (error: any) {
      toast.error(t('massUpload.downloadFailed'), { description: error?.message });
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
    toast.success(editingChild ? t('dataUpdated') : t('childAdded'));
  };

  const handleViewAbsences = (child: Child) => {
    setSelectedChild(child);
    setShowAbsences(true);
  };

  const columns: Column<Child>[] = [
    { key: 'id', header: t('common:common.id') },
    { key: 'lastName', header: t('common:common.lastName') },
    { key: 'firstName', header: t('common:common.firstName') },
    { key: 'group', header: t('common:common.group'), render: (row) => row.group.name },
    {
      key: 'actions',
      header: t('common:common.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            {t('common:actions.edit')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleViewAbsences(row)}>
            <CalendarX className="h-4 w-4 mr-1" /> {t('absences')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">{t('title')}</h1>

      <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{t('massUpload.title')}</p>
          <p className="text-sm text-gray-600">{t('massUpload.description')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleChildrenExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" /> {isExporting ? t('common:actions.preparing') : t('massUpload.excelTemplate')}
          </Button>
          <Button onClick={() => navigate('/integration#children')}>
            <UploadCloud className="mr-2 h-4 w-4" /> {t('massUpload.goToImport')}
          </Button>
        </div>
      </Card>
      <div className="mb-4 mobile-stack">
        <div className="search-container">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> {t('addChild')}
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
        title={editingChild ? t('editChild') : t('addNewChild')}
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
        title={t('absencesTitle', { firstName: selectedChild?.firstName, lastName: selectedChild?.lastName })}
      >
        {selectedChild && <AbsencesView childId={selectedChild.id} />}
      </Modal>
    </div>
  );
}

function AbsencesView({ childId }: { childId: number }) {
  const { t } = useTranslation('children');
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
      toast.error(t('loadError'), { description: error?.message });
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
      toast.success(t('absenceAdded'));
      setShowForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      loadAbsences();
    } catch (error: any) {
      toast.error(t('addError'), { description: error?.message });
    }
  };

  const handleDelete = async (absenceId: number) => {
    if (!confirm(t('deleteAbsenceConfirm'))) return;
    try {
      await api.delete(`/api/children/absences/${absenceId}`);
      toast.success(t('absenceDeleted'));
      loadAbsences();
    } catch (error: any) {
      toast.error(t('deleteError'), { description: error?.message });
    }
  };

  if (loading) return <div className="p-4">{t('common:actions.loading')}</div>;

  return (
    <div className="p-4 space-y-4">
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> {t('addAbsence')}
        </Button>
      ) : (
        <form onSubmit={handleAddAbsence} className="border p-4 rounded space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t('startDate')}</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('endDate')}</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('reason')}</label>
            <Input 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              placeholder={t('reasonPlaceholder')} 
              required 
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">{t('common:actions.save')}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              {t('common:actions.cancel')}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {absences.length === 0 ? (
          <p className="text-gray-500 text-sm">{t('noAbsences')}</p>
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
                {t('common:actions.delete')}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
