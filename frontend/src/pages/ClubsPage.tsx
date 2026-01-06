import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { DataTable, Column } from '../components/DataTable/DataTable';
import { Button } from '../components/ui/button';
import { Modal } from '../components/Modal';
import { Input } from '../components/ui/input';
import { Card } from '../components/Card';
import { PlusCircle, AlertTriangle, Star, BarChart3, Users, FileText, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

interface Club {
  id: number;
  name: string;
  description?: string | null;
  teacherId: number;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
  cost: number;
  maxStudents: number;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
}

interface ClubRating {
  id: number;
  clubId: number;
  childId: number;
  rating: number;
  comment?: string;
  child: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

interface ClubReport {
  club: {
    id: number;
    name: string;
    teacher: string;
    maxStudents: number;
  };
  enrollments: {
    active: number;
    waiting: number;
    total: number;
  };
  attendance: {
    totalPresent: number;
  };
  finances: {
    income: number;
    expense: number;
    balance: number;
  };
}

interface Child {
  id: number;
  firstName: string;
  lastName: string;
}

type TabType = 'clubs' | 'ratings' | 'reports';

export default function ClubsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('clubs');
  const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 });
  const { data: clubs, total, page, setPage, fetchData } = useApi<Club>({
    url: '/api/clubs',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teacherId: '',
    cost: '',
    maxStudents: ''
  });
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingClub, setDeletingClub] = useState<Club | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Ratings state
  const [selectedClubForRatings, setSelectedClubForRatings] = useState<Club | null>(null);
  const [ratings, setRatings] = useState<ClubRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingFormData, setRatingFormData] = useState({ childId: '', rating: '5', comment: '' });
  const [enrolledChildren, setEnrolledChildren] = useState<Child[]>([]);

  // Reports state
  const [selectedClubForReport, setSelectedClubForReport] = useState<Club | null>(null);
  const [report, setReport] = useState<ClubReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Загрузка списка педагогов при монтировании
  useEffect(() => {
    setIsLoadingTeachers(true);
    api.get('/api/employees?pageSize=200')
      .then((data: any) => {
        // Handle both array and {items, total} formats
        const items = Array.isArray(data) ? data : (data?.items || []);
        setTeachers(items);
      })
      .catch((error: any) => {
        toast.error('Не удалось загрузить список педагогов', { description: error?.message });
        setTeachers([]);
      })
      .finally(() => setIsLoadingTeachers(false));
  }, []);

  const handleCreate = () => {
    setEditingClub(null);
    setFormData({
      name: '',
      description: '',
      teacherId: '',
      cost: '',
      maxStudents: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      description: club.description || '',
      teacherId: String(club.teacherId),
      cost: String(club.cost),
      maxStudents: String(club.maxStudents)
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (club: Club) => {
    setDeletingClub(club);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingClub) return;
    setDeleting(true);
    try {
      await api.delete('/api/clubs/' + deletingClub.id);
      toast.success('Кружок удален');
      setDeleteModalOpen(false);
      setDeletingClub(null);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка удаления', { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        teacherId: parseInt(formData.teacherId),
        cost: parseFloat(formData.cost),
        maxStudents: parseInt(formData.maxStudents)
      };

      if (editingClub) {
        await api.put('/api/clubs/' + editingClub.id, payload);
        toast.success('Кружок обновлен');
      } else {
        await api.post('/api/clubs', payload);
        toast.success('Кружок создан');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Ошибка сохранения', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  // === Ratings functions ===
  const loadRatings = async (club: Club) => {
    setSelectedClubForRatings(club);
    setRatingsLoading(true);
    try {
      const data = await api.get(`/api/clubs/${club.id}/ratings`);
      setRatings(data.ratings || []);
      setAvgRating(data.average || 0);
    } catch (error: any) {
      toast.error('Ошибка загрузки рейтингов', { description: error?.message });
    } finally {
      setRatingsLoading(false);
    }
  };

  const openAddRatingModal = async (club: Club) => {
    setSelectedClubForRatings(club);
    setRatingFormData({ childId: '', rating: '5', comment: '' });
    try {
      const children = await api.get('/api/children?pageSize=500');
      setEnrolledChildren(children.items || children || []);
    } catch (e) {
      console.error('Failed to load children');
    }
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubForRatings) return;
    setSaving(true);
    try {
      await api.post(`/api/clubs/${selectedClubForRatings.id}/ratings`, {
        childId: parseInt(ratingFormData.childId),
        rating: parseInt(ratingFormData.rating),
        comment: ratingFormData.comment || null
      });
      toast.success('Оценка добавлена');
      setIsRatingModalOpen(false);
      loadRatings(selectedClubForRatings);
    } catch (error: any) {
      toast.error('Ошибка', { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteRating = async (ratingId: number) => {
    try {
      await api.delete(`/api/clubs/ratings/${ratingId}`);
      toast.success('Оценка удалена');
      if (selectedClubForRatings) loadRatings(selectedClubForRatings);
    } catch (error: any) {
      toast.error('Ошибка', { description: error?.message });
    }
  };

  // === Reports functions ===
  const loadReport = async (club: Club) => {
    setSelectedClubForReport(club);
    setReportLoading(true);
    try {
      const data = await api.get(`/api/clubs/${club.id}/reports`);
      setReport(data);
    } catch (error: any) {
      toast.error('Ошибка загрузки отчёта', { description: error?.message });
    } finally {
      setReportLoading(false);
    }
  };

  const columns: Column<Club>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Название' },
    { 
      key: 'teacher', 
      header: 'Педагог',
      render: (row) => row.teacher.firstName + ' ' + row.teacher.lastName
    },
    { 
      key: 'cost', 
      header: 'Стоимость',
      render: (row) => `${currency.format(row.cost)}/мес`
    },
    { key: 'maxStudents', header: 'Макс. детей' },
    {
      key: 'actions',
      header: 'Действия',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
            Редактировать
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openDeleteModal(row)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'clubs' as TabType, label: 'Кружки', icon: Users },
    { id: 'ratings' as TabType, label: 'Рейтинги', icon: Star },
    { id: 'reports' as TabType, label: 'Отчёты', icon: BarChart3 },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Кружки и секции</h1>
        {activeTab === 'clubs' && (
          <Button onClick={handleCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить кружок
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Clubs Tab */}
      {activeTab === 'clubs' && (
        <DataTable
          columns={columns}
          data={clubs}
          page={page}
          pageSize={10}
          total={total}
          onPageChange={setPage}
        />
      )}

      {/* Ratings Tab */}
      {activeTab === 'ratings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <h3 className="text-lg font-semibold p-4 border-b">Выберите кружок</h3>
            <div className="divide-y max-h-[500px] overflow-auto">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => loadRatings(club)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedClubForRatings?.id === club.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium">{club.name}</div>
                  <div className="text-sm text-gray-500">
                    {club.teacher.firstName} {club.teacher.lastName}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {!selectedClubForRatings ? (
              <div className="p-8 text-center text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Выберите кружок для просмотра рейтингов</p>
              </div>
            ) : ratingsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="mt-2 text-gray-500">Загрузка...</p>
              </div>
            ) : (
              <div>
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedClubForRatings.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(Math.round(avgRating))}
                      <span className="text-gray-600">{avgRating.toFixed(1)} ({ratings.length} оценок)</span>
                    </div>
                  </div>
                  <Button onClick={() => openAddRatingModal(selectedClubForRatings)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Добавить оценку
                  </Button>
                </div>
                
                <div className="divide-y max-h-[400px] overflow-auto">
                  {ratings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Нет оценок</div>
                  ) : (
                    ratings.map((rating) => (
                      <div key={rating.id} className="p-4 flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {rating.child.firstName} {rating.child.lastName}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(rating.rating)}
                          </div>
                          {rating.comment && (
                            <p className="text-sm text-gray-600 mt-2">{rating.comment}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteRating(rating.id)}>
                          Удалить
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <h3 className="text-lg font-semibold p-4 border-b">Выберите кружок</h3>
            <div className="divide-y max-h-[500px] overflow-auto">
              {clubs.map((club) => (
                <button
                  key={club.id}
                  onClick={() => loadReport(club)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedClubForReport?.id === club.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium">{club.name}</div>
                  <div className="text-sm text-gray-500">
                    {club.teacher.firstName} {club.teacher.lastName}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            {!selectedClubForReport ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Выберите кружок для просмотра отчёта</p>
              </div>
            ) : reportLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                <p className="mt-2 text-gray-500">Загрузка...</p>
              </div>
            ) : report ? (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-semibold">{report.club.name}</h3>
                <p className="text-gray-600">Педагог: {report.club.teacher}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600">Активных записей</p>
                    <p className="text-2xl font-bold text-blue-700">{report.enrollments.active}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-600">В листе ожидания</p>
                    <p className="text-2xl font-bold text-yellow-700">{report.enrollments.waiting}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Максимум</p>
                    <p className="text-2xl font-bold">{report.club.maxStudents}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Финансы</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600">Доходы</p>
                      <p className="text-xl font-bold text-green-700">{currency.format(report.finances.income)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-red-600">Расходы</p>
                      <p className="text-xl font-bold text-red-700">{currency.format(report.finances.expense)}</p>
                    </div>
                    <div className={`rounded-lg p-4 ${report.finances.balance >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <p className="text-sm text-gray-600">Баланс</p>
                      <p className={`text-xl font-bold ${report.finances.balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {currency.format(report.finances.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClub ? 'Редактировать кружок' : 'Новый кружок'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Рисование"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Творческое развитие детей"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Педагог *</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
              required
              disabled={isLoadingTeachers}
            >
              <option value="">{isLoadingTeachers ? 'Загружаем...' : 'Выберите педагога'}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.lastName} {teacher.firstName} — {teacher.position}
                </option>
              ))}
            </select>
          </div>

          <div>
              <label className="block text-sm font-medium mb-1">Стоимость (UZS/мес) *</label>
            <Input
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              required
              placeholder="1000000"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Максимум детей *</label>
            <Input
              type="number"
              value={formData.maxStudents}
              onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
              required
              placeholder="15"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Rating Modal */}
      <Modal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        title="Добавить оценку"
      >
        <form onSubmit={handleRatingSubmit} className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium mb-1">Ребёнок *</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={ratingFormData.childId}
              onChange={(e) => setRatingFormData({ ...ratingFormData, childId: e.target.value })}
              required
            >
              <option value="">Выберите ребёнка</option>
              {enrolledChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.lastName} {child.firstName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Оценка *</label>
            <select
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={ratingFormData.rating}
              onChange={(e) => setRatingFormData({ ...ratingFormData, rating: e.target.value })}
              required
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} ⭐</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              value={ratingFormData.comment}
              onChange={(e) => setRatingFormData({ ...ratingFormData, comment: e.target.value })}
              rows={3}
              placeholder="Отзыв о занятиях..."
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsRatingModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание!</h4>
              <p className="text-red-700 text-sm mt-1">
                Вы собираетесь удалить кружок. Это действие нельзя отменить. 
                Все записи детей в этот кружок также будут удалены.
              </p>
            </div>
          </div>
          {deletingClub && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p><strong>Название:</strong> {deletingClub.name}</p>
              <p><strong>Педагог:</strong> {deletingClub.teacher.firstName} {deletingClub.teacher.lastName}</p>
              <p><strong>Стоимость:</strong> {currency.format(deletingClub.cost)}/мес</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
