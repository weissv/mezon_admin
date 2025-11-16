import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { PlusCircle, AlertCircle, UploadCloud, Download } from 'lucide-react';
import { EmployeeForm } from '../components/forms/EmployeeForm';
import { Employee } from '../types/employee';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function EmployeesPage() {
  const { t } = useTranslation(['employees', 'common']);
  const { data, total, page, setPage, fetchData } = useApi<Employee>({
    url: '/api/employees',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [reminders, setReminders] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await api.get('/api/employees/reminders');
      setReminders(data);
    } catch (error: any) {
      console.error('Failed to load reminders:', error);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchData();
    toast.success(editingEmployee ? t('dataUpdated') : t('employeeAdded'));
  };

  const handleEmployeesExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.download('/api/integration/export/excel/employees');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `employees-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(t('massUpload.templateDownloaded'));
    } catch (error: any) {
      toast.error(t('massUpload.downloadFailed'), { description: error?.message });
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<Employee>[] = [
    { key: 'id', header: t('common:common.id') },
    { key: 'lastName', header: t('common:common.lastName') },
    { key: 'firstName', header: t('common:common.firstName') },
    { key: 'position', header: t('common:common.position') },
    { key: 'branch', header: t('common:common.branch'), render: (row) => row.branch.name },
    {
      key: 'actions',
      header: t('common:common.actions'),
      render: (row) => (
        <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
          {t('common:actions.edit')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>

      <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{t('massUpload.title')}</p>
          <p className="text-sm text-gray-600">{t('massUpload.description')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleEmployeesExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" /> {isExporting ? t('common:actions.preparing') : t('massUpload.excelTemplate')}
          </Button>
          <Button onClick={() => navigate('/integration#employees')}>
            <UploadCloud className="mr-2 h-4 w-4" /> {t('massUpload.goToImport')}
          </Button>
        </div>
      </Card>

      {/* Reminders Widget */}
      {reminders && (reminders.medicalCheckups.length > 0 || reminders.attestations.length > 0) && (
        <Card className="mb-6 p-4 bg-orange-50 border-orange-200">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">{t('reminders.title')}</h3>
              
              {reminders.medicalCheckups.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    {t('reminders.medicalCheckups')} ({reminders.medicalCheckups.length}):
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {reminders.medicalCheckups.map((emp: any) => (
                      <li key={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.position}) - {t('reminders.daysUntil', { days: emp.daysUntil })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {reminders.attestations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    {t('reminders.attestations')} ({reminders.attestations.length}):
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {reminders.attestations.map((emp: any) => (
                      <li key={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.position}) - {t('reminders.daysUntil', { days: emp.daysUntil })}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="mb-4 flex justify-end">
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('addEmployee')}
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
        title={editingEmployee ? t('editEmployee') : t('addNewEmployee')}
      >
        <EmployeeForm
          initialData={editingEmployee}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}