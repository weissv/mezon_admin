// src/pages/lms/LmsClassesPage.tsx
import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  X,
} from "lucide-react";
import { lmsApi } from "../../lib/lms-api";
import { useAuth } from "../../hooks/useAuth";
import type { LmsSchoolClass } from "../../types/lms";
import { toast } from "sonner";
import { useLmsClasses } from "../../hooks/lms/useLmsClasses";

export default function LmsClassesPage() {
  const { user } = useAuth();
  const { classes, loading, refetch, error } = useLmsClasses({ isActive: true });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClass, setEditingClass] = useState<LmsSchoolClass | null>(null);

  const isAdmin = user && ["DIRECTOR", "DEPUTY", "ADMIN"].includes(user.role);

  const filteredClasses = classes.filter((cls) => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = selectedGrade === null || cls.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const grades = [...new Set(classes.map((c) => c.grade).filter((g): g is number => g !== null && g !== undefined))].sort((a, b) => a - b);

  useEffect(() => {
    if (error) {
      console.error("Failed to fetch classes:", error);
      toast.error("Не удалось загрузить классы");
    }
  }, [error]);

  // Group classes by grade
  const classesByGrade = filteredClasses.reduce((acc, cls) => {
    const grade = cls.grade ?? 0;
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(cls);
    return acc;
  }, {} as Record<number, LmsSchoolClass[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Классы</h1>
          <p className="text-gray-500">
            Управление школьными классами и учениками
            <span className="text-xs text-gray-400 ml-2">
              (синхронизировано с ERP)
            </span>
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <a
              href="/groups"
              className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <Edit className="h-4 w-4" />
              Управление в ERP
            </a>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition"
            >
              <Plus className="h-5 w-5" />
              Добавить класс
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию класса..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedGrade(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedGrade === null
                  ? "bg-teal-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Все
            </button>
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedGrade === grade
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {grade} класс
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {Object.keys(classesByGrade).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Классы не найдены</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
            >
              <Plus className="h-5 w-5" />
              Добавить первый класс
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(classesByGrade)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([grade, gradeClasses]) => (
              <div key={grade}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {grade} класс
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {gradeClasses.map((cls) => (
                    <div
                      key={cls.id}
                      onClick={() => setEditingClass(cls)}
                      className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                          <span className="text-xl font-bold text-teal-600">{cls.name}</span>
                        </div>
                        <Edit className="h-5 w-5 text-gray-300 group-hover:text-teal-600 transition" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>{cls.studentsCount || 0} учеников</span>
                        </div>
                        {cls.teacher && (
                          <p className="text-sm text-gray-500 truncate">
                            Классный рук.: {cls.teacher.lastName} {cls.teacher.firstName?.charAt(0)}.
                          </p>
                        )}
                        {cls.academicYear && (
                          <p className="text-xs text-gray-400">{cls.academicYear}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <EditClassModal
          classData={editingClass}
          onClose={() => setEditingClass(null)}
          onUpdated={() => {
            setEditingClass(null);
            refetch();
          }}
          onDeleted={() => {
            setEditingClass(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateClassModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    grade: 1,
    section: "",
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    teacherId: undefined as number | undefined,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await lmsApi.createClass({
        name: formData.section ? `${formData.grade}${formData.section}` : `${formData.grade}`,
        grade: formData.grade,
        academicYear: formData.academicYear,
        teacherId: formData.teacherId,
      });
      toast.success("Класс создан");
      onCreated();
    } catch (error) {
      console.error("Failed to create class:", error);
      toast.error("Не удалось создать класс");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Добавить класс</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Класс
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g} класс
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Буква
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Без буквы</option>
                {["А", "Б", "В", "Г", "Д"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Учебный год
            </label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="2024-2025"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditClassModal({
  classData,
  onClose,
  onUpdated,
  onDeleted,
}: {
  classData: LmsSchoolClass;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  // Извлекаем букву из названия класса (например "2А" -> "А")
  const extractSection = (name: string) => {
    const match = name.match(/\d+([А-Я])/i);
    return match ? match[1].toUpperCase() : "";
  };

  const [formData, setFormData] = useState({
    name: classData.name,
    grade: classData.grade || 1,
    section: extractSection(classData.name),
    academicYear: classData.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    teacherId: classData.teacherId || undefined as number | undefined,
    capacity: classData.capacity || undefined as number | undefined,
    description: classData.description || "",
  });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await lmsApi.updateClass(classData.id, {
        name: formData.section ? `${formData.grade}${formData.section}` : `${formData.grade}`,
        grade: formData.grade,
        academicYear: formData.academicYear,
        teacherId: formData.teacherId,
        capacity: formData.capacity,
        description: formData.description || undefined,
      });
      toast.success("Класс обновлён");
      onUpdated();
    } catch (error) {
      console.error("Failed to update class:", error);
      toast.error("Не удалось обновить класс");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Удалить класс ${classData.name}? Это действие нельзя отменить.`)) return;
    
    setDeleting(true);
    try {
      await lmsApi.deleteClass(classData.id);
      toast.success("Класс удалён");
      onDeleted();
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast.error("Не удалось удалить класс");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Редактировать класс</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Класс
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((g) => (
                  <option key={g} value={g}>
                    {g} класс
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Буква
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Без буквы</option>
                {["А", "Б", "В", "Г", "Д", "Е", "Ж", "З"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Учебный год
            </label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="2024-2025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Вместимость
            </label>
            <input
              type="number"
              value={formData.capacity || ""}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={2}
              placeholder="Дополнительная информация о классе"
            />
          </div>
          
          {/* Информация о классе */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{classData.studentsCount || 0} учеников в классе</span>
            </div>
            {classData.teacher && (
              <p className="text-gray-500 mt-1">
                Классный рук.: {classData.teacher.lastName} {classData.teacher.firstName}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
            >
              {deleting ? "..." : "Удалить"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition disabled:opacity-50"
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
