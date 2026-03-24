// src/pages/ChildrenPage.tsx
// Список детей с фильтрами, поиском и действиями
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Download,
  UploadCloud,
  Trash2,
  AlertCircle,
  Eye,
  Archive,
  Filter,
  X,
} from 'lucide-react';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';
import { Card } from '../components/Card';
import { ChildForm } from '../components/forms/ChildForm';
import { useChildren, useChildMutations, useGroups } from '../hooks/useChildren';
import { api } from '../lib/api';
import { toast } from 'sonner';
import type { Child, ChildFilters, Gender } from '../types/child';

const genderLabel = (g?: Gender | null) => {
  if (g === 'MALE') return 'М';
  if (g === 'FEMALE') return 'Ж';
  return '—';
};

const statusLabel = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'Активен';
    case 'LEFT': return 'Выбыл';
    case 'ARCHIVED': return 'Архив';
    default: return s;
  }
};

const statusBadge = (s: string) => {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    LEFT: 'bg-yellow-100 text-yellow-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[s] ?? 'bg-gray-100'}`}>
      {statusLabel(s)}
    </span>
  );
};

export default function ChildrenPage() {
  const {
    data,
    total,
    page,
    filters,
    loading,
    setPage,
    setFilters,
    refresh,
  } = useChildren({ sortBy: 'lastName' });
  const { archiveChild, deleteChild, saving } = useChildMutations();
  const { groups } = useGroups();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Child | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // --- Search handler ---
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev: ChildFilters) => ({ ...prev, search: searchInput || undefined }));
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // --- Handlers ---
  const handleCreate = () => { setEditingChild(null); setIsModalOpen(true); };
  const handleEdit = (child: Child) => { setEditingChild(child); setIsModalOpen(true); };
  const handleFormSuccess = () => {
    setIsModalOpen(false);
    refresh();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await api.download('/api/integration/export/excel/children');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `children-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Шаблон с детьми выгружен');
    } catch (err: any) {
      toast.error('Не удалось скачать шаблон', { description: err?.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteChild(deleteConfirm.id);
      setDeleteConfirm(null);
      refresh();
    } catch {
      // toast from hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async (child: Child) => {
    await archiveChild(child.id);
    refresh();
  };

  const hasActiveFilters = !!(filters.status || filters.groupId || filters.gender);

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  // --- Columns ---
  const columns: Column<Child>[] = [
    { key: 'id', header: '№' },
    {
      key: 'fullName',
      header: 'ФИО',
      render: (row) => (
        <button
          className="text-left text-blue-600 hover:underline font-medium"
          onClick={() => navigate(`/children/${row.id}`)}
        >
          {row.lastName} {row.firstName} {row.middleName || ''}
        </button>
      ),
    },
    { key: 'group', header: 'Класс', render: (row) => row.group.name },
    {
      key: 'birthDate',
      header: 'Дата рожд.',
      render: (row) => new Date(row.birthDate).toLocaleDateString('ru-RU'),
    },
    { key: 'gender', header: 'Пол', render: (row) => genderLabel(row.gender) },
    {
      key: 'parents',
      header: 'Родители',
      render: (row) => {
        if (row.parents?.length) {
          return (
            <div className="text-sm">
              {row.parents.map((p) => (
                <div key={p.id}>
                  {p.fullName}{p.phone ? ` (${p.phone})` : ''}
                </div>
              ))}
            </div>
          );
        }
        // Fallback to legacy
        return row.parentPhone || '—';
      },
    },
    { key: 'status', header: 'Статус', render: (row) => statusBadge(row.status) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/children/${row.id}`)} title="Профиль">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} title="Редактировать">
            <PlusCircle className="h-4 w-4" />
          </Button>
          {row.status === 'ACTIVE' && (
            <Button variant="ghost" size="sm" onClick={() => handleArchive(row)} disabled={saving} title="В архив">
              <Archive className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteConfirm(row)} title="Удалить">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Управление контингентом детей</h1>

      {/* Import/Export Card */}
      <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Массовая загрузка списков</p>
          <p className="text-sm text-gray-600">Импортируйте детей из Excel/Google Sheets или выгрузите актуальный шаблон для кураторов.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" /> {isExporting ? 'Готовим...' : 'Шаблон Excel'}
          </Button>
          <Button onClick={() => navigate('/integration#children')}>
            <UploadCloud className="mr-2 h-4 w-4" /> Перейти к импорту
          </Button>
        </div>
      </Card>

      {/* Search + Filters + Add */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
            <Input
              placeholder="Поиск по ФИО..."
              className="pl-8"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" /> Фильтры
            {hasActiveFilters && <span className="ml-1 bg-white text-black rounded-full text-xs w-4 h-4 inline-flex items-center justify-center">!</span>}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Сбросить
            </Button>
          )}
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Добавить ребенка
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-4 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Статус</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.status ?? ''}
                onChange={(e) => {
                  setFilters((prev: ChildFilters) => ({ ...prev, status: (e.target.value as any) || undefined }));
                  setPage(1);
                }}
              >
                <option value="">Все</option>
                <option value="ACTIVE">Активные</option>
                <option value="LEFT">Выбывшие</option>
                <option value="ARCHIVED">Архив</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Класс</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.groupId ?? ''}
                onChange={(e) => {
                  setFilters((prev: ChildFilters) => ({ ...prev, groupId: e.target.value ? Number(e.target.value) : undefined }));
                  setPage(1);
                }}
              >
                <option value="">Все классы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Пол</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={filters.gender ?? ''}
                onChange={(e) => {
                  setFilters((prev: ChildFilters) => ({ ...prev, gender: (e.target.value as Gender) || undefined }));
                  setPage(1);
                }}
              >
                <option value="">Все</option>
                <option value="MALE">Мужской</option>
                <option value="FEMALE">Женский</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        page={page}
        pageSize={10}
        total={total}
        onPageChange={setPage}
        wrapCells={true}
      />

      {/* Create/Edit Modal */}
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

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удаление ученика">
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
                Все связанные данные (посещаемость, отсутствия, записи в кружки) будут удалены.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
