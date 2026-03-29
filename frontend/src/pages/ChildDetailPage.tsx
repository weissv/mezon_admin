// src/pages/ChildDetailPage.tsx
// Детальная карточка ребёнка
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, CalendarX, Users, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/Card';
import { Modal } from '../components/Modal';
import { ChildForm } from '../components/forms/ChildForm';
import { AbsencesView } from '../components/children/AbsencesView';
import { useChild, useChildMutations } from '../hooks/useChildren';
import type { HealthInfo, Gender } from '../types/child';

const genderLabel = (g?: Gender | null) => {
  if (g === 'MALE') return 'Мужской';
  if (g === 'FEMALE') return 'Женский';
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

const statusColor = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'bg-[rgba(52,199,89,0.12)] text-green-800';
    case 'LEFT': return 'bg-[rgba(255,204,0,0.12)] text-yellow-800';
    case 'ARCHIVED': return 'bg-[var(--fill-tertiary)] text-[var(--text-secondary)]';
    default: return 'bg-[var(--fill-tertiary)] text-[var(--text-secondary)]';
  }
};

function HealthBlock({ info }: { info: HealthInfo | null | undefined }) {
  if (!info) return <p className="text-sm text-[var(--text-tertiary)]">Не указана</p>;
  return (
    <div className="text-sm space-y-1">
      {info.allergies?.length ? <p><span className="font-medium">Аллергии:</span> {info.allergies.join(', ')}</p> : null}
      {info.specialConditions?.length ? <p><span className="font-medium">Особые условия:</span> {info.specialConditions.join(', ')}</p> : null}
      {info.medications?.length ? <p><span className="font-medium">Медикаменты:</span> {info.medications.join(', ')}</p> : null}
      {info.notes ? <p><span className="font-medium">Примечания:</span> {info.notes}</p> : null}
    </div>
  );
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = id ? Number(id) : null;
  const { child, loading, error, refresh } = useChild(numId);
  const { archiveChild, saving } = useChildMutations();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showAbsences, setShowAbsences] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[200px] text-[var(--text-secondary)]">Загрузка...</div>;
  }

  if (error || !child) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--color-red)] mb-3">Ребёнок не найден</p>
        <Button variant="outline" onClick={() => navigate('/children')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> К списку
        </Button>
      </div>
    );
  }

  const fullName = [child.lastName, child.firstName, child.middleName].filter(Boolean).join(' ');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/children')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl sm:macos-text-title">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(child.status)}`}>
                {statusLabel(child.status)}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">{child.group.name}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit className="mr-1 h-4 w-4" /> Редактировать
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAbsences(true)}>
            <CalendarX className="mr-1 h-4 w-4" /> Отсутствия
          </Button>
          {child.status === 'ACTIVE' && (
            <Button
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={async () => {
                await archiveChild(child.id);
                refresh();
              }}
            >
              <Archive className="mr-1 h-4 w-4" /> В архив
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Основные данные */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Основные данные</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Дата рождения" value={new Date(child.birthDate).toLocaleDateString('ru-RU')} />
            <Row label="Пол" value={genderLabel(child.gender as Gender)} />
            <Row label="Национальность" value={child.nationality || '—'} />
            <Row label="Адрес" value={child.address || '—'} />
            <Row label="Номер метрики" value={child.birthCertificateNumber || '—'} />
          </dl>
        </Card>

        {/* Родители */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-1">
            <Users className="h-4 w-4" /> Родители / Опекуны
          </h3>
          {child.parents && child.parents.length > 0 ? (
            <div className="space-y-3">
              {child.parents.map((p) => (
                <div key={p.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                  <p className="font-medium text-sm">{p.fullName} <span className="text-[var(--text-secondary)] font-normal">({p.relation})</span></p>
                  {p.phone && <p className="text-xs text-[var(--text-secondary)]">{p.phone}</p>}
                  {p.email && <p className="text-xs text-[var(--text-secondary)]">{p.email}</p>}
                  {p.workplace && <p className="text-xs text-[var(--text-tertiary)]">{p.workplace}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-tertiary)]">
              {child.fatherName || child.motherName
                ? <>
                    {child.fatherName && <span className="block">Отец: {child.fatherName}</span>}
                    {child.motherName && <span className="block">Мать: {child.motherName}</span>}
                    {child.parentPhone && <span className="block text-xs text-[var(--text-secondary)]">Тел: {child.parentPhone}</span>}
                  </>
                : 'Не указана'}
            </p>
          )}
        </Card>

        {/* Договор */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Договор</h3>
          <dl className="space-y-2 text-sm">
            <Row label="№ договора" value={child.contractNumber || '—'} />
            <Row label="Дата договора" value={child.contractDate ? new Date(child.contractDate).toLocaleDateString('ru-RU') : '—'} />
          </dl>
        </Card>

        {/* Мед. сведения */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3">Медицинские сведения</h3>
          <HealthBlock info={child.healthInfo as HealthInfo | null} />
        </Card>

        {/* Кружки */}
        {child.enrollments && child.enrollments.length > 0 && (
          <Card className="p-4 md:col-span-2">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-1">
              <BookOpen className="h-4 w-4" /> Кружки
            </h3>
            <div className="flex flex-wrap gap-2">
              {child.enrollments.map((e) => (
                <span key={e.id} className="inline-block bg-[rgba(0,122,255,0.06)] text-[var(--color-blue)] text-xs px-2 py-1 rounded-full">
                  {e.club.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Последние отсутствия */}
        {child.temporaryAbsences && child.temporaryAbsences.length > 0 && (
          <Card className="p-4 md:col-span-2">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-1">
              <CalendarX className="h-4 w-4" /> Последние отсутствия
            </h3>
            <div className="space-y-1">
              {child.temporaryAbsences.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">
                    {new Date(a.startDate).toLocaleDateString('ru-RU')} &mdash; {new Date(a.endDate).toLocaleDateString('ru-RU')}
                  </span>
                  {a.reason && <span className="text-[var(--text-secondary)]">— {a.reason}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Редактировать данные">
        <ChildForm
          initialData={child}
          onSuccess={() => { setIsEditOpen(false); refresh(); }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      {/* Absences Modal */}
      <Modal isOpen={showAbsences} onClose={() => setShowAbsences(false)} title={`Отсутствия — ${fullName}`}>
        <AbsencesView childId={child.id} />
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--text-secondary)]">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
