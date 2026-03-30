import { useState, useEffect} from 'react';
import { toast} from 'sonner';
import { useApi} from '../hooks/useApi';
import { DataTable, Column} from '../components/DataTable/DataTable';
import { Button} from '../components/ui/button';
import { Modal} from '../components/Modal';
import { Input} from '../components/ui/input';
import { Card} from '../components/Card';
import { PlusCircle, AlertTriangle, Star, BarChart3, Users, FileText, Loader2} from 'lucide-react';
import { api} from '../lib/api';

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
const selectClassName = 'mezon-field';
const textareaClassName = 'mezon-field min-h-[96px] resize-y';

export default function ClubsPage() {
 const [activeTab, setActiveTab] = useState<TabType>('clubs');
 const currency = new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0});
 const { data: clubs, total, page, setPage, fetchData} = useApi<Club>({
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
 const [ratingFormData, setRatingFormData] = useState({ childId: '', rating: '5', comment: ''});
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
 toast.error('Не удалось загрузить список педагогов', { description: error?.message});
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
 toast.error('Ошибка удаления', { description: error?.message});
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
 toast.error('Ошибка сохранения', { description: error?.message});
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
 toast.error('Ошибка загрузки рейтингов', { description: error?.message});
} finally {
 setRatingsLoading(false);
}
};

 const openAddRatingModal = async (club: Club) => {
 setSelectedClubForRatings(club);
 setRatingFormData({ childId: '', rating: '5', comment: ''});
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
 toast.error('Ошибка', { description: error?.message});
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
 toast.error('Ошибка', { description: error?.message});
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
 toast.error('Ошибка загрузки отчёта', { description: error?.message});
} finally {
 setReportLoading(false);
}
};

 const columns: Column<Club>[] = [
 { key: 'id', header: 'ID'},
 { key: 'name', header: 'Название'},
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
 { key: 'maxStudents', header: 'Макс. детей'},
 {
 key: 'actions',
 header: 'Действия',
 render: (row) => (
 <div className="flex gap-2">
 <Button variant="outline"size="sm"onClick={() => handleEdit(row)}>
 Редактировать
 </Button>
 <Button variant="destructive"size="sm"onClick={() => openDeleteModal(row)}>
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
 className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-tertiary'}`}
 />
 ))}
 </div>
 );
};

 const tabs = [
 { id: 'clubs' as TabType, label: 'Кружки', icon: Users},
 { id: 'ratings' as TabType, label: 'Рейтинги', icon: Star},
 { id: 'reports' as TabType, label: 'Отчёты', icon: BarChart3},
 ];

 return (
 <div className="space-y-6">
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[rgba(191,90,242,0.14)] text-[var(--macos-purple)] shadow-[0_10px_24px_rgba(191,90,242,0.12)]">
 <Star className="h-5 w-5"/>
 </div>
 <div>
 <div className="mezon-badge mb-2">Clubs · развитие</div>
 <h1 className="mezon-section-title mb-1">Кружки и секции</h1>
 <p className="mezon-subtitle">Каталог кружков, рейтинги детей и отчёты по загрузке и финансам в едином рабочем пространстве.</p>
 </div>
 </div>
 {activeTab === 'clubs' && (
 <Button onClick={handleCreate}>
 <PlusCircle className="mr-2 h-4 w-4"/> Добавить кружок
 </Button>
 )}
 </div>

 {/* Tabs */}
 <div className="inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-[16px] border border-card bg-surface-primary p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-[24px]">
 <nav className="flex gap-1">
 {tabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-medium uppercase tracking-widest macos-transition ${
 activeTab === tab.id
 ? 'bg-[rgba(255,255,255,0.9)] text-primary shadow-[0_8px_20px_rgba(15,23,42,0.08)]'
 : 'text-secondary hover:bg-[rgba(255,255,255,0.58)] hover:text-primary'
}`}
 >
 <tab.icon className="h-4 w-4"/>
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
 <h3 className="border-b border-[rgba(60,60,67,0.12)] p-4 text-[14px] font-semibold tracking-[-0.01em] text-primary">Выберите кружок</h3>
 <div className="max-h-[500px] divide-y divide-[rgba(60,60,67,0.12)] overflow-auto">
 {clubs.map((club) => (
 <button
 key={club.id}
 onClick={() => loadRatings(club)}
 className={`w-full p-4 text-left macos-transition ${
 selectedClubForRatings?.id === club.id ? 'bg-[rgba(10,132,255,0.08)]' : 'hover:bg-[rgba(255,255,255,0.5)]'
}`}
 >
 <div className="font-medium text-primary">{club.name}</div>
 <div className="text-sm text-secondary">
 {club.teacher.firstName} {club.teacher.lastName}
 </div>
 </button>
 ))}
 </div>
 </Card>

 <Card className="lg:col-span-2">
 {!selectedClubForRatings ? (
 <div className="p-8 text-center text-secondary">
 <Star className="mx-auto mb-4 h-12 w-12 text-[rgba(191,90,242,0.28)]"/>
 <p>Выберите кружок для просмотра рейтингов</p>
 </div>
 ) : ratingsLoading ? (
 <div className="p-8 text-center">
 <Loader2 className="mx-auto h-8 w-8 animate-spin text-macos-blue"/>
 <p className="mt-2 text-secondary">Загрузка...</p>
 </div>
 ) : (
 <div>
 <div className="flex items-center justify-between border-b border-[rgba(60,60,67,0.12)] p-4">
 <div>
 <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-primary">{selectedClubForRatings.name}</h3>
 <div className="flex items-center gap-2 mt-1">
 {renderStars(Math.round(avgRating))}
 <span className="text-secondary">{avgRating.toFixed(1)} ({ratings.length} оценок)</span>
 </div>
 </div>
 <Button onClick={() => openAddRatingModal(selectedClubForRatings)}>
 <PlusCircle className="mr-2 h-4 w-4"/> Добавить оценку
 </Button>
 </div>
 
 <div className="max-h-[400px] divide-y divide-[rgba(60,60,67,0.12)] overflow-auto">
 {ratings.length === 0 ? (
 <div className="p-8 text-center text-secondary">Нет оценок</div>
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
 <p className="mt-2 text-sm text-secondary">{rating.comment}</p>
 )}
 </div>
 <Button variant="ghost"size="sm"onClick={() => deleteRating(rating.id)}>
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
 <h3 className="border-b border-[rgba(60,60,67,0.12)] p-4 text-[14px] font-semibold tracking-[-0.01em] text-primary">Выберите кружок</h3>
 <div className="max-h-[500px] divide-y divide-[rgba(60,60,67,0.12)] overflow-auto">
 {clubs.map((club) => (
 <button
 key={club.id}
 onClick={() => loadReport(club)}
 className={`w-full p-4 text-left macos-transition ${
 selectedClubForReport?.id === club.id ? 'bg-[rgba(10,132,255,0.08)]' : 'hover:bg-[rgba(255,255,255,0.5)]'
}`}
 >
 <div className="font-medium text-primary">{club.name}</div>
 <div className="text-sm text-secondary">
 {club.teacher.firstName} {club.teacher.lastName}
 </div>
 </button>
 ))}
 </div>
 </Card>

 <Card className="lg:col-span-2">
 {!selectedClubForReport ? (
 <div className="p-8 text-center text-secondary">
 <FileText className="mx-auto mb-4 h-12 w-12 text-[rgba(10,132,255,0.22)]"/>
 <p>Выберите кружок для просмотра отчёта</p>
 </div>
 ) : reportLoading ? (
 <div className="p-8 text-center">
 <Loader2 className="mx-auto h-8 w-8 animate-spin text-macos-blue"/>
 <p className="mt-2 text-secondary">Загрузка...</p>
 </div>
 ) : report ? (
 <div className="p-6 space-y-6">
 <h3 className="text-xl font-semibold text-primary">{report.club.name}</h3>
 <p className="text-secondary">Педагог: {report.club.teacher}</p>
 
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 <div className="rounded-lg bg-[rgba(10,132,255,0.12)] p-4">
 <p className="text-sm text-macos-blue">Активных записей</p>
 <p className="text-[24px] font-bold tracking-[-0.025em] leading-tight text-primary">{report.enrollments.active}</p>
 </div>
 <div className="rounded-lg bg-[rgba(255,204,0,0.12)] p-4">
 <p className="text-sm text-[var(--macos-orange)]">В листе ожидания</p>
 <p className="text-[24px] font-bold tracking-[-0.025em] leading-tight text-primary">{report.enrollments.waiting}</p>
 </div>
 <div className="rounded-lg bg-[rgba(255,255,255,0.58)] p-4">
 <p className="text-sm text-secondary">Максимум</p>
 <p className="text-[24px] font-bold tracking-[-0.025em] leading-tight text-primary">{report.club.maxStudents}</p>
 </div>
 </div>

 <div className="border-t border-[rgba(60,60,67,0.12)] pt-4">
 <h4 className="mb-3 font-semibold text-primary">Финансы</h4>
 <div className="grid grid-cols-3 gap-4">
 <div className="rounded-lg bg-[rgba(52,199,89,0.14)] p-4">
 <p className="text-sm text-[var(--macos-green)]">Доходы</p>
 <p className="text-[24px] font-bold tracking-[-0.025em] leading-tight text-primary">{currency.format(report.finances.income)}</p>
 </div>
 <div className="rounded-lg bg-[rgba(255,59,48,0.12)] p-4">
 <p className="text-sm text-[var(--macos-red)]">Расходы</p>
 <p className="text-[24px] font-bold tracking-[-0.025em] leading-tight text-primary">{currency.format(report.finances.expense)}</p>
 </div>
 <div className={`rounded-lg p-4 ${report.finances.balance >= 0 ? 'bg-[rgba(52,199,89,0.14)]' : 'bg-[rgba(255,59,48,0.12)]'}`}>
 <p className="text-sm text-secondary">Баланс</p>
 <p className={`text-[24px] font-bold tracking-[-0.025em] leading-tight ${report.finances.balance >= 0 ? 'text-[var(--macos-green)]' : 'text-[var(--macos-red)]'}`}>
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
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Название *</label>
 <Input
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value})}
 required
 placeholder="Рисование"
 />
 </div>

 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Описание</label>
 <Input
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value})}
 placeholder="Творческое развитие детей"
 />
 </div>

 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Педагог *</label>
 <select
 className={selectClassName}
 value={formData.teacherId}
 onChange={(e) => setFormData({ ...formData, teacherId: e.target.value})}
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
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Стоимость (UZS/мес) *</label>
 <Input
 type="number"
 value={formData.cost}
 onChange={(e) => setFormData({ ...formData, cost: e.target.value})}
 required
 placeholder="1000000"
 step="0.01"
 />
 </div>

 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Максимум детей *</label>
 <Input
 type="number"
 value={formData.maxStudents}
 onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value})}
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
 <Button type="submit"disabled={saving}>
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
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Ребёнок *</label>
 <select
 className={selectClassName}
 value={ratingFormData.childId}
 onChange={(e) => setRatingFormData({ ...ratingFormData, childId: e.target.value})}
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
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Оценка *</label>
 <select
 className={selectClassName}
 value={ratingFormData.rating}
 onChange={(e) => setRatingFormData({ ...ratingFormData, rating: e.target.value})}
 required
 >
 {[5, 4, 3, 2, 1].map((r) => (
 <option key={r} value={r}>{r} ⭐</option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Комментарий</label>
 <textarea
 className={textareaClassName}
 value={ratingFormData.comment}
 onChange={(e) => setRatingFormData({ ...ratingFormData, comment: e.target.value})}
 rows={3}
 placeholder="Отзыв о занятиях..."
 />
 </div>

 <div className="flex gap-2 justify-end pt-4">
 <Button type="button"variant="ghost"onClick={() => setIsRatingModalOpen(false)}>
 Отмена
 </Button>
 <Button type="submit"disabled={saving}>
 {saving ? 'Сохранение...' : 'Сохранить'}
 </Button>
 </div>
 </form>
 </Modal>

 {/* Delete confirmation modal */}
 <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Подтверждение удаления">
 <div className="p-4 space-y-4">
 <div className="flex items-start gap-3 rounded-lg border border-[rgba(255,59,48,0.18)] bg-[rgba(255,59,48,0.08)] p-4">
 <AlertTriangle className="mt-0.5 h-6 w-6 flex-shrink-0 text-[var(--macos-red)]"/>
 <div>
 <h4 className="font-semibold text-[var(--macos-red)]">Внимание!</h4>
 <p className="mt-1 text-sm text-[var(--macos-red)]">
 Вы собираетесь удалить кружок. Это действие нельзя отменить. 
 Все записи детей в этот кружок также будут удалены.
 </p>
 </div>
 </div>
 {deletingClub && (
 <div className="rounded-lg bg-[rgba(255,255,255,0.58)] p-3">
 <p><strong>Название:</strong> {deletingClub.name}</p>
 <p><strong>Педагог:</strong> {deletingClub.teacher.firstName} {deletingClub.teacher.lastName}</p>
 <p><strong>Стоимость:</strong> {currency.format(deletingClub.cost)}/мес</p>
 </div>
 )}
 <div className="flex justify-end gap-2 pt-2">
 <Button variant="outline"onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
 Отмена
 </Button>
 <Button variant="destructive"onClick={handleDelete} disabled={deleting}>
 {deleting ? 'Удаление...' : 'Удалить'}
 </Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
