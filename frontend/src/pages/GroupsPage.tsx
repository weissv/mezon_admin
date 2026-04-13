import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, Edit, PlusCircle, Search, Trash2, UserCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Modal, ModalActions, ModalNotice, ModalSection } from '../components/Modal';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { EmptyListState, ErrorState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/input';
import { LoadingCard } from '../components/ui/LoadingState';
import { PageHeader, PageStack, PageToolbar } from '../components/ui/page';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

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

const selectClassName = 'mezon-field';
const pageSize = 10;

function getResolvedGrade(group: Group) {
  return group.grade ?? Number(group.name.match(/\d+/)?.[0] || 0);
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const groupFormId = 'group-editor-form';

  const [formGrade, setFormGrade] = useState<number>(1);
  const [formSection, setFormSection] = useState<string>('');
  const [formAcademicYear, setFormAcademicYear] = useState<string>(
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  );
  const [formTeacherId, setFormTeacherId] = useState<number | ''>('');
  const [formCapacity, setFormCapacity] = useState<number>(30);
  const [formDescription, setFormDescription] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [groupsData, employeesData] = await Promise.all([
        api.get('/api/groups'),
        api.get('/api/employees'),
      ]);
      setGroups(groupsData || []);
      setEmployees(employeesData?.items || employeesData || []);
    } catch (error: any) {
      const message = error?.message || 'Не удалось загрузить классы';
      setErrorMessage(message);
      toast.error('Ошибка загрузки данных', { description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, gradeFilter]);

  const teachers = employees.filter(
    (employee) =>
      employee.position.toLowerCase().includes('учител') ||
      employee.position.toLowerCase().includes('педагог') ||
      employee.position.toLowerCase().includes('преподаватель'),
  );

  const gradeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          groups
            .map(getResolvedGrade)
            .filter((grade) => grade > 0),
        ),
      ).sort((a, b) => a - b),
    [groups],
  );

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return groups.filter((group) => {
      const resolvedGrade = getResolvedGrade(group);
      const matchesGrade = gradeFilter === 'ALL' || String(resolvedGrade) === gradeFilter;
      const haystack = [
        group.name,
        group.academicYear,
        group.description,
        group.teacher?.firstName,
        group.teacher?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesGrade && (!query || haystack.includes(query));
    });
  }, [gradeFilter, groups, search]);

  const paginatedGroups = useMemo(
    () => filteredGroups.slice((page - 1) * pageSize, page * pageSize),
    [filteredGroups, page],
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
    const gradeMatch = group.name.match(/^(\d+)([А-Яа-яA-Za-z])?/);
    setFormGrade(group.grade ?? (gradeMatch ? parseInt(gradeMatch[1], 10) : 1));
    setFormSection(gradeMatch?.[2] || '');
    setFormAcademicYear(group.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);
    setFormTeacherId(group.teacherId || '');
    setFormCapacity(group.capacity || 30);
    setFormDescription(group.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      await loadData();
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
      await loadData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Group>[] = [
    { key: 'name', header: 'Класс' },
    {
      key: 'teacher',
      header: 'Классный руководитель',
      render: (row) =>
        row.teacher ? (
          <span className="inline-flex items-center gap-1.5">
            <UserCircle className="h-4 w-4 text-tertiary" />
            {row.teacher.lastName} {row.teacher.firstName}
          </span>
        ) : (
          'Не назначен'
        ),
    },
    {
      key: 'children',
      header: 'Ученики',
      render: (row) => row._count?.children || 0,
    },
    {
      key: 'academicYear',
      header: 'Учебный год',
      render: (row) => row.academicYear || '—',
    },
    {
      key: 'capacity',
      header: 'Вместимость',
      render: (row) => row.capacity || '—',
    },
    {
      key: 'description',
      header: 'Описание',
      render: (row) => row.description || '—',
    },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row)}
            aria-label={`Редактировать класс ${row.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirm(row)}
            aria-label={`Удалить класс ${row.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        eyebrow="Учебная структура"
        title="Классы"
        icon={<Users className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral">{filteredGroups.length} классов</span>}
        description="ERP и LMS используют один каталог классов. На этом экране удобно искать класс, видеть руководителя, количество учеников и быстро корректировать параметры."
        actions={
          <>
            <Link to="/lms/school/classes">
              <Button variant="outline">
                <BookOpen className="h-4 w-4" />
                Открыть в LMS
              </Button>
            </Link>
            <Button onClick={handleCreate}>
              <PlusCircle className="h-4 w-4" />
              Добавить класс
            </Button>
          </>
        }
      />

      <PageToolbar>
        <div className="mezon-toolbar-group">
          <div className="mezon-input-shell">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по названию, руководителю или описанию"
              className="min-w-[280px]"
            />
          </div>
          <select
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
            className={selectClassName}
          >
            <option value="ALL">Все классы</option>
            {gradeOptions.map((grade) => (
              <option key={grade} value={String(grade)}>
                {grade} класс
              </option>
            ))}
          </select>
        </div>
      </PageToolbar>

      <DataTable
        title="Реестр классов"
        description="Список помогает быстро находить класс, видеть состав и переходить к редактированию без просмотра карточек по отдельности."
        toolbar={
          <div className="mezon-kicker-list">
            <span className="mezon-data-table__toolbar-pill">Всего: {groups.length}</span>
            <span className="mezon-data-table__toolbar-pill">После фильтров: {filteredGroups.length}</span>
          </div>
        }
        columns={columns}
        data={paginatedGroups}
        page={page}
        pageSize={pageSize}
        total={filteredGroups.length}
        onPageChange={setPage}
        density="compact"
        wrapCells
        emptyState={
          loading ? (
            <LoadingCard message="Загружаем классы..." height={220} />
          ) : errorMessage ? (
            <ErrorState message={errorMessage} onRetry={loadData} className="py-10" />
          ) : (
            <EmptyListState
              title="Классы не найдены"
              description="Измените фильтры или создайте первый класс, чтобы он появился и в ERP, и в LMS."
              onAction={handleCreate}
              actionLabel="Добавить класс"
              className="py-10"
            />
          )
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? 'Редактировать класс' : 'Новый класс'}
        eyebrow="Учебная структура"
        description="Соберите карточку класса так, чтобы администратору было легко проверить состав, вместимость и ответственного педагога."
        icon={<Users className="h-5 w-5" />}
        size="lg"
        meta={<span className="mezon-badge macos-badge-neutral">{formSection ? `${formGrade}${formSection}` : `${formGrade} класс`}</span>}
        footer={
          <ModalActions>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
              Отмена
            </Button>
            <Button form={groupFormId} type="submit" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </ModalActions>
        }
      >
        <form id={groupFormId} onSubmit={handleSubmit} className="mezon-modal-form">
          <ModalSection title="Идентификация класса" description="Сначала задайте номер и букву класса, чтобы сразу видеть итоговое название.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mezon-form-label">Класс (номер)</label>
                <select value={formGrade} onChange={(event) => setFormGrade(Number(event.target.value))} className={selectClassName}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((grade) => (
                    <option key={grade} value={grade}>
                      {grade} класс
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mezon-form-label mezon-form-label--regular">Буква класса</label>
                <select value={formSection} onChange={(event) => setFormSection(event.target.value)} className={selectClassName}>
                  <option value="">Без буквы</option>
                  {['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З'].map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <ModalNotice title="Предпросмотр" tone="info">
              Итоговое название будет сохранено как <strong>{formSection ? `${formGrade}${formSection}` : `${formGrade} класс`}</strong>.
            </ModalNotice>
          </ModalSection>

          <ModalSection title="Организация класса" description="Добавьте параметры, которые чаще всего нужны завучу и классному руководителю.">
            <div>
              <label className="mezon-form-label mezon-form-label--regular">Учебный год</label>
              <Input
                value={formAcademicYear}
                onChange={(event) => setFormAcademicYear(event.target.value)}
                placeholder="2024-2025"
              />
            </div>

            <div>
              <label className="mezon-form-label">Классный руководитель</label>
              <select
                value={formTeacherId}
                onChange={(event) => setFormTeacherId(event.target.value ? Number(event.target.value) : '')}
                className={selectClassName}
              >
                <option value="">Не назначен</option>
                {(teachers.length > 0 ? teachers : employees).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.lastName} {teacher.firstName} ({teacher.position})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mezon-form-label mezon-form-label--regular">Вместимость класса</label>
                <Input
                  type="number"
                  value={formCapacity}
                  onChange={(event) => setFormCapacity(Number(event.target.value))}
                  min={1}
                  max={50}
                />
              </div>

              <div>
                <label className="mezon-form-label mezon-form-label--regular">Описание (опционально)</label>
                <Input
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  placeholder="Профиль, особенности класса..."
                />
              </div>
            </div>
          </ModalSection>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление класса"
        eyebrow="Опасное действие"
        description="Удаление класса повлияет на связанных учеников и организационные данные. Подтверждайте действие только после проверки последствий."
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!isDeleting}
        closeOnEscape={!isDeleting}
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </ModalActions>
        }
      >
        {deleteConfirm ? (
          <>
            <ModalNotice title="Удаление затронет связанные записи" tone="danger">
              Класс будет удалён без возможности восстановления. Если в нём уже есть ученики, их данные также потребуют отдельной проверки и переноса.
            </ModalNotice>

            <ModalSection title="Проверка перед удалением" description="Убедитесь, что удаляете нужный класс и понимаете масштаб изменений.">
              <div className="mezon-modal-facts">
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Класс</span>
                  <span className="mezon-modal-fact__value">{deleteConfirm.name}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Учебный год</span>
                  <span className="mezon-modal-fact__value">{deleteConfirm.academicYear || 'Не указан'}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Учеников в классе</span>
                  <span className="mezon-modal-fact__value">{deleteConfirm._count?.children || 0}</span>
                </div>
              </div>
            </ModalSection>
          </>
        ) : null}
      </Modal>
    </PageStack>
  );
}
