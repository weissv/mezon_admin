// src/components/children/AbsencesView.tsx
// Отдельный компонент управления отсутствиями ребёнка
import { useState} from 'react';
import { PlusCircle, AlertTriangle} from 'lucide-react';
import { Button} from '../ui/button';
import { Input} from '../ui/input';
import { Modal} from '../Modal';
import { useAbsences} from '../../hooks/useChildren';
import type { TemporaryAbsence} from '../../types/child';

interface AbsencesViewProps {
 childId: number;
}

export function AbsencesView({ childId}: AbsencesViewProps) {
 const { absences, loading, addAbsence, deleteAbsence} = useAbsences(childId);

 const [showForm, setShowForm] = useState(false);
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
 const [reason, setReason] = useState('');
 const [submitting, setSubmitting] = useState(false);

 const [deleteConfirm, setDeleteConfirm] = useState<TemporaryAbsence | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);

 const handleAdd = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);
 try {
 await addAbsence({ startDate, endDate, reason});
 setShowForm(false);
 setStartDate('');
 setEndDate('');
 setReason('');
} catch {
 // toast already shown by hook
} finally {
 setSubmitting(false);
}
};

 const handleDelete = async () => {
 if (!deleteConfirm) return;
 setIsDeleting(true);
 try {
 await deleteAbsence(deleteConfirm.id);
 setDeleteConfirm(null);
} catch {
 // toast already shown by hook
} finally {
 setIsDeleting(false);
}
};

 if (loading) return <div className="p-4 text-sm text-secondary">Загрузка...</div>;

 return (
 <div className="p-4 space-y-4">
 {!showForm ? (
 <Button onClick={() => setShowForm(true)} size="sm">
 <PlusCircle className="mr-2 h-4 w-4"/> Добавить отсутствие
 </Button>
 ) : (
 <form onSubmit={handleAdd} className="border p-4 rounded space-y-3">
 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Дата начала</label>
 <Input type="date"value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
 </div>
 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Дата окончания</label>
 <Input type="date"value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
 </div>
 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Причина</label>
 <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Семейный отпуск"required />
 </div>
 <div className="flex gap-2">
 <Button type="submit"size="sm"disabled={submitting}>{submitting ? 'Сохранение...' : 'Сохранить'}</Button>
 <Button type="button"variant="ghost"size="sm"onClick={() => setShowForm(false)}>Отмена</Button>
 </div>
 </form>
 )}

 <div className="space-y-2">
 {absences.length === 0 ? (
 <p className="text-secondary text-sm">Нет записей об отсутствиях</p>
 ) : (
 absences.map((absence) => (
 <div key={absence.id} className="flex justify-between items-center p-3 border rounded">
 <div>
 <div className="font-medium text-sm">
 {new Date(absence.startDate).toLocaleDateString('ru-RU')} &mdash; {new Date(absence.endDate).toLocaleDateString('ru-RU')}
 </div>
 {absence.reason && <div className="text-sm text-secondary">{absence.reason}</div>}
 </div>
 <Button variant="destructive"size="sm"onClick={() => setDeleteConfirm(absence)}>Удалить</Button>
 </div>
 ))
 )}
 </div>

 {/* Delete confirmation */}
 <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Удаление отсутствия">
 <div className="p-4">
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0 w-10 h-10 bg-[rgba(255,59,48,0.12)] rounded-full flex items-center justify-center">
 <AlertTriangle className="h-5 w-5 text-macos-red"/>
 </div>
 <div className="flex-1">
 <p className="font-medium text-primary">Вы уверены, что хотите удалить эту запись?</p>
 {deleteConfirm && (
 <div className="mt-2 p-3 bg-fill-quaternary rounded-md">
 <p className="text-[11px] font-medium uppercase tracking-widest">
 {new Date(deleteConfirm.startDate).toLocaleDateString('ru-RU')} &mdash; {new Date(deleteConfirm.endDate).toLocaleDateString('ru-RU')}
 </p>
 {deleteConfirm.reason && <p className="text-xs text-secondary mt-1">{deleteConfirm.reason}</p>}
 </div>
 )}
 <p className="text-sm text-secondary mt-2">Это действие нельзя отменить.</p>
 </div>
 </div>
 <div className="flex justify-end gap-3 mt-6">
 <Button variant="ghost"onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>Отмена</Button>
 <Button variant="destructive"onClick={handleDelete} disabled={isDeleting}>
 {isDeleting ? 'Удаление...' : 'Удалить'}
 </Button>
 </div>
 </div>
 </Modal>
 </div>
 );
}
