import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/input';
import { 
  PlusCircle, 
  Trash2, 
  Edit2, 
  Users, 
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  BarChart3
} from 'lucide-react';

interface Branch {
  id: number;
  name: string;
}

interface StaffingTable {
  id: number;
  branchId: number;
  position: string;
  requiredRate: number;
  branch: { id: number; name: string };
}

interface StaffingReport {
  branchId: number;
  branchName: string;
  position: string;
  requiredRate: number;
  currentRate: number;
  deficit: number;
}

export default function StaffingPage() {
  const [tables, setTables] = useState<StaffingTable[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [report, setReport] = useState<StaffingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'table' | 'report'>('table');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StaffingTable | null>(null);
  const [formData, setFormData] = useState({ branchId: '', position: '', requiredRate: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; item: StaffingTable | null }>({
    open: false,
    item: null
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter
  const [filterBranchId, setFilterBranchId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchTables();
    fetchReport();
  }, [filterBranchId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchesRes = await api.get('/api/branches') as Branch[];
      setBranches(branchesRes);
      await Promise.all([fetchTables(), fetchReport()]);
    } catch (error: any) {
      toast.error('Ошибка загрузки данных', { description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const params = filterBranchId ? `?branchId=${filterBranchId}` : '';
      const data = await api.get(`/api/staffing/tables${params}`) as StaffingTable[];
      setTables(data);
    } catch (error: any) {
      console.error('Error fetching staffing tables:', error);
    }
  };

  const fetchReport = async () => {
    try {
      const params = filterBranchId ? `?branchId=${filterBranchId}` : '';
      const data = await api.get(`/api/staffing/report${params}`) as StaffingReport[];
      setReport(data);
    } catch (error: any) {
      console.error('Error fetching staffing report:', error);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({ branchId: branches[0]?.id?.toString() || '', position: '', requiredRate: '1' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: StaffingTable) => {
    setEditingItem(item);
    setFormData({
      branchId: item.branchId.toString(),
      position: item.position,
      requiredRate: item.requiredRate.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchId || !formData.position || !formData.requiredRate) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        branchId: Number(formData.branchId),
        position: formData.position.trim(),
        requiredRate: Number(formData.requiredRate)
      };

      if (editingItem) {
        await api.put(`/api/staffing/tables/${editingItem.id}`, payload);
        toast.success('Позиция обновлена');
      } else {
        await api.post('/api/staffing/tables', payload);
        toast.success('Позиция добавлена');
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      fetchTables();
      fetchReport();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirm = (item: StaffingTable) => {
    setDeleteConfirm({ open: true, item });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.item) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/staffing/tables/${deleteConfirm.item.id}`);
      toast.success('Позиция удалена');
      setDeleteConfirm({ open: false, item: null });
      fetchTables();
      fetchReport();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Group tables by branch
  const tablesByBranch = tables.reduce((acc, item) => {
    const branchName = item.branch.name;
    if (!acc[branchName]) {
      acc[branchName] = [];
    }
    acc[branchName].push(item);
    return acc;
  }, {} as Record<string, StaffingTable[]>);

  // Group report by branch
  const reportByBranch = report.reduce((acc, item) => {
    if (!acc[item.branchName]) {
      acc[item.branchName] = [];
    }
    acc[item.branchName].push(item);
    return acc;
  }, {} as Record<string, StaffingReport[]>);

  // Calculate summary
  const summary = report.reduce(
    (acc, item) => ({
      totalRequired: acc.totalRequired + item.requiredRate,
      totalCurrent: acc.totalCurrent + item.currentRate,
      totalDeficit: acc.totalDeficit + Math.max(0, item.deficit)
    }),
    { totalRequired: 0, totalCurrent: 0, totalDeficit: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Штатное расписание
        </h1>
        <Button onClick={openCreateModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить позицию
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">По штату</p>
              <p className="text-2xl font-bold">{summary.totalRequired.toFixed(1)} ставок</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Фактически</p>
              <p className="text-2xl font-bold">{summary.totalCurrent.toFixed(1)} ставок</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full ${summary.totalDeficit > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              {summary.totalDeficit > 0 ? (
                <TrendingDown className="h-6 w-6 text-red-600" />
              ) : (
                <TrendingUp className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Дефицит</p>
              <p className={`text-2xl font-bold ${summary.totalDeficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {summary.totalDeficit > 0 ? `-${summary.totalDeficit.toFixed(1)}` : '0'} ставок
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'table' ? 'default' : 'outline'}
            onClick={() => setActiveTab('table')}
          >
            Штатная таблица
          </Button>
          <Button
            variant={activeTab === 'report' ? 'default' : 'outline'}
            onClick={() => setActiveTab('report')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Отчёт о соответствии
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={filterBranchId}
            onChange={(e) => setFilterBranchId(e.target.value)}
          >
            <option value="">Все филиалы</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'table' ? (
        <div className="space-y-6">
          {Object.keys(tablesByBranch).length === 0 ? (
            <Card>
              <div className="p-8 text-center text-gray-500">
                Штатное расписание пусто. Добавьте первую позицию.
              </div>
            </Card>
          ) : (
            Object.entries(tablesByBranch).map(([branchName, items]) => (
              <Card key={branchName}>
                <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    {branchName}
                    <span className="text-sm text-gray-500 font-normal">
                      ({items.length} позиций, {items.reduce((sum, i) => sum + i.requiredRate, 0).toFixed(1)} ставок)
                    </span>
                  </h3>
                </div>
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{item.position}</p>
                        <p className="text-sm text-gray-500">Требуется: {item.requiredRate} ставки</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openDeleteConfirm(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.keys(reportByBranch).length === 0 ? (
            <Card>
              <div className="p-8 text-center text-gray-500">
                Нет данных для отчёта. Добавьте штатные позиции.
              </div>
            </Card>
          ) : (
            Object.entries(reportByBranch).map(([branchName, items]) => (
              <Card key={branchName}>
                <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    {branchName}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-sm">
                      <tr>
                        <th className="px-4 py-3 text-left">Должность</th>
                        <th className="px-4 py-3 text-center">По штату</th>
                        <th className="px-4 py-3 text-center">Фактически</th>
                        <th className="px-4 py-3 text-center">Дефицит</th>
                        <th className="px-4 py-3 text-center">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{item.position}</td>
                          <td className="px-4 py-3 text-center">{item.requiredRate}</td>
                          <td className="px-4 py-3 text-center">{item.currentRate}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={item.deficit > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {item.deficit > 0 ? `-${item.deficit}` : item.deficit < 0 ? `+${Math.abs(item.deficit)}` : '0'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.deficit > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <AlertTriangle className="h-3 w-3" />
                                Недостаток
                              </span>
                            ) : item.deficit < 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                <TrendingUp className="h-3 w-3" />
                                Избыток
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                Укомплектовано
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Редактировать позицию' : 'Добавить позицию'}
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Филиал *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              required
              disabled={!!editingItem}
            >
              <option value="">Выберите филиал</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Должность *</label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Например: Воспитатель"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Кол-во ставок *</label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.requiredRate}
              onChange={(e) => setFormData({ ...formData, requiredRate: e.target.value })}
              placeholder="1"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : editingItem ? 'Сохранить' : 'Добавить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, item: null })} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить позицию из штатного расписания. Это действие нельзя отменить.
              </p>
            </div>
          </div>
          {deleteConfirm.item && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Должность:</strong> {deleteConfirm.item.position}</p>
              <p><strong>Филиал:</strong> {deleteConfirm.item.branch.name}</p>
              <p><strong>Ставок:</strong> {deleteConfirm.item.requiredRate}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, item: null })} disabled={isDeleting}>
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
