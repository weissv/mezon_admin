// src/pages/GroupsPage.tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Edit, Users, AlertTriangle, UserCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card } from '../components/Card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Modal } from '../components/Modal';

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
}

interface Group {
  id: number;
  name: string;
  grade?: number | null;
  academicYear?: string | null;
  teacherId?: number | null;
  capacity?: number;
  description?: string | null;
  teacher?: Teacher | null;
  _count?: {
    children: number;
  };
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formGrade, setFormGrade] = useState<number>(1);
  const [formSection, setFormSection] = useState<string>('');
  const [formAcademicYear, setFormAcademicYear] = useState<string>(
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  );
  const [formTeacherId, setFormTeacherId] = useState<number | ''>('');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formDescription, setFormDescription] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsData, employeesData] = await Promise.all([
        api.get('/api/groups'),
        api.get('/api/employees')
      ]);
      setGroups(groupsData || []);
      setEmployees(employeesData?.items || employeesData || []);
    } catch (error: any) {
      toast.error('Ошибка загрузки данных', { description: error?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teachers = employees.filter(e => 
    e.position.toLowerCase().includes('учител') || 
    e.position.toLowerCase().includes('педагог') ||
    e.position.toLowerCase().includes('преподаватель')
  );

  const handleCreate = () => {
    setEditingGroup(null);
    setFormGrade(1);
    setFormSection('');
    setFormAcademicYear(`${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setFormTeacherId('');
    setFormCapacity(30);
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    // Парсим grade и section из имени, если они не заданы явно
    const gradeMatch = group.name.match(/^(\d+)([А-Яа-яA-Za-z])?/);
    setFormGrade(group.grade ?? (gradeMatch ? parseInt(gradeMatch[1]) : 1));
    setFormSection(gradeMatch?.[2] || '');
    setFormAcademicYear(group.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setFormTeacherId(group.teacherId || '');
    setFormCapacity(group.capacity || 30);
    setFormDescription(group.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const name = formSection ? `${formGrade}${formSection}` : `${formGrade} класс`;

    setIsSaving(true);
    try {
      const payload = {
        name,
        grade: formGrade,
        academicYear: formAcademicYear || null,
        teacherId: formTeacherId || null,
        capacity: formCapacity,
        description: formDescription || null,
      };

      if (editingGroup) {
        await api.put(`/api/groups/${editingGroup.id}`, payload);
        toast.success('Класс обновлён');
      } else {
        await api.post('/api/groups', payload);
        toast.success('Класс создан');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/groups/${deleteConfirm.id}`);
      toast.success('Класс удалён');
      setDeleteConfirm(null);
      loadData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Группировка классов по номеру (grade)
  const groupsByGrade = groups.reduce((acc, group) => {
    const grade = group.grade ?? parseInt(group.name.match(/\d+/)?.[0] || '0');
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(group);
    return acc;
  }, {} as Record<number, Group[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка классов...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-bold">Управление классами</h1>
            <p className="text-sm text-gray-500">
              Классы синхронизированы с LMS
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/lms/school/classes">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" /> Открыть в LMS
            </Button>
          </Link>
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить класс
          </Button>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          Классы не найдены. Добавьте первый класс.
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupsByGrade)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([grade, gradeGroups]) => (
              <div key={grade}>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  {grade} класс
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {gradeGroups.map((group) => (
                    <Card
                      key={group.id}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{group.name}</p>
                          <div className="mt-2 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{group._count?.children || 0} учеников</span>
                            </div>
                            {group.teacher && (
                              <div className="flex items-center gap-1">
                                <UserCircle className="h-4 w-4" />
                                <span className="truncate">
                                  {group.teacher.lastName} {group.teacher.firstName?.charAt(0)}.
                                </span>
                              </div>
                            )}
                            {group.academicYear && (
                              <p className="text-xs text-gray-400">
                                {group.academicYear}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(group)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(group)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? 'Редактировать класс' : 'Новый класс'}
      >
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">
                Класс (номер)
              </label>
              <select
                value={formGrade}
                onChange={(e) => setFormGrade(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g} класс
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">
                Буква класса
              </label>
              <select
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Без буквы</option>
                {['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Учебный год
            </label>
            <Input
              value={formAcademicYear}
              onChange={(e) => setFormAcademicYear(e.target.value)}
              placeholder="2024-2025"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Классный руководитель
            </label>
            <select
              value={formTeacherId}
              onChange={(e) => setFormTeacherId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Не назначен</option>
              {teachers.length > 0 ? (
                teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.lastName} {t.firstName} ({t.position})
                  </option>
                ))
              ) : (
                employees.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.lastName} {t.firstName} ({t.position})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Вместимость класса
            </label>
            <Input
              type="number"
              value={formCapacity}
              onChange={(e) => setFormCapacity(Number(e.target.value))}
              min={1}
              max={50}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">
              Описание (опционально)
            </label>
            <Input
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Профиль, особенности класса..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление класса"
      >
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                Вы уверены, что хотите удалить этот класс?
              </p>
              {deleteConfirm && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium">{deleteConfirm.name}</p>
                  {deleteConfirm._count && deleteConfirm._count.children > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      В классе {deleteConfirm._count.children} учеников!
                    </p>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Это действие нельзя отменить. Все связанные данные будут удалены.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
