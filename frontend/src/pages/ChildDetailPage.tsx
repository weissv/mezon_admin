// src/pages/ChildDetailPage.tsx
// Детальная карточка ребёнка
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Archive, CalendarX, Users, BookOpen, HeartPulse, FileText, Paperclip } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal, ModalNotice, ModalSection } from '../components/Modal';
import { ErrorState } from '../components/ui/EmptyState';
import { LoadingCard } from '../components/ui/LoadingState';
import { PageHeader, PageSection, PageStack } from '../components/ui/page';
import { ChildForm } from '../components/forms/ChildForm';
import { AbsencesView } from '../components/children/AbsencesView';
import { StudentDocumentsSection } from '../components/children/StudentDocumentsSection';
import { useChild, useChildMutations } from '../hooks/useChildren';
import type { HealthInfo, Gender } from '../types/child';

const genderLabel = (g?: Gender | null) => {
  if (g === 'MALE') return 'Мужской';
  if (g === 'FEMALE') return 'Женский';
  return '—';
};

const statusVariant = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'success';
    case 'LEFT': return 'warning';
    case 'ARCHIVED': return 'neutral';
    default: return 'neutral';
  }
};

const statusLabel = (s: string) => {
  switch (s) {
    case 'ACTIVE': return 'Активен';
    case 'LEFT': return 'Выбыл';
    case 'ARCHIVED': return 'В архиве';
    default: return s;
  }
};

function HealthBlock({ info }: { info: HealthInfo | null | undefined }) {
  if (!info) return <p className="text-[13px] text-text-tertiary">Не указана</p>;
  return (
    <div className="text-[13px] space-y-1.5 text-text-secondary">
      {info.allergies?.length ? <p><span className="font-semibold text-text-primary">Аллергии:</span> {info.allergies.join(', ')}</p> : null}
      {info.specialConditions?.length ? <p><span className="font-semibold text-text-primary">Особые условия:</span> {info.specialConditions.join(', ')}</p> : null}
      {info.medications?.length ? <p><span className="font-semibold text-text-primary">Медикаменты:</span> {info.medications.join(', ')}</p> : null}
      {info.notes ? <p><span className="font-semibold text-text-primary">Примечания:</span> {info.notes}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-2 py-1.5 border-b border-separator/30 last:border-0">
      <dt className="text-[13px] text-text-tertiary">{label}</dt>
      <dd className="text-[13px] font-medium text-text-primary text-right">{value}</dd>
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
    return <LoadingCard message="Загружаем карточку ребёнка..." height={220} />;
  }

  if (error || !child) {
    return (
      <ErrorState message="Ребёнок не найден" onRetry={() => navigate('/children')} className="py-10" />
    );
  }

  const fullName = [child.lastName, child.firstName, child.middleName].filter(Boolean).join(' ');

  return (
    <PageStack className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Профиль ребёнка"
        title={fullName}
        description={<span className="text-[14px] text-text-tertiary">{child.group.name}</span>}
        icon={<BookOpen className="h-5 w-5 text-macos-blue" />}
        meta={
          <Badge variant={statusVariant(child.status) as any} dot>
            {statusLabel(child.status)}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/children')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> К списку
            </Button>
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
        }
      />

      <PageSection className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Основные данные */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Основные данные</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1">
              <Row label="Дата рождения" value={new Date(child.birthDate).toLocaleDateString('ru-RU')} />
              <Row label="Пол" value={genderLabel(child.gender as Gender)} />
              <Row label="Национальность" value={child.nationality || '—'} />
              <Row label="Адрес" value={child.address || '—'} />
              <Row label="Номер метрики" value={child.birthCertificateNumber || '—'} />
            </dl>
          </CardContent>
        </Card>

        {/* Приказы */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Приказы и движения</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-1">
              <Row label="Приказ о прибытии" value={child.admissionOrderNumber ? `№${child.admissionOrderNumber} от ${child.admissionOrderDate ? new Date(child.admissionOrderDate).toLocaleDateString('ru-RU') : ''}` : '—'} />
              {child.previousSchool && <Row label="Из школы" value={child.previousSchool} />}
              <Row label="Приказ о выбытии" value={child.dismissalOrderNumber ? `№${child.dismissalOrderNumber} от ${child.dismissalOrderDate ? new Date(child.dismissalOrderDate).toLocaleDateString('ru-RU') : ''}` : '—'} />
              {child.nextSchool && <Row label="В школу" value={child.nextSchool} />}
            </dl>
          </CardContent>
        </Card>

        {/* Родители */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-macos-blue" />
              Родители / Опекуны
            </CardTitle>
          </CardHeader>
          <CardContent>
            {child.parents && child.parents.length > 0 ? (
              <div className="space-y-3">
                {child.parents.map((p) => (
                  <div key={p.id} className="border-b border-separator/30 pb-2.5 last:border-b-0 last:pb-0">
                    <p className="font-semibold text-[13px] text-text-primary">{p.fullName} <span className="text-text-tertiary font-normal">({p.relation})</span></p>
                    {p.phone && <p className="text-[12px] text-text-secondary">{p.phone}</p>}
                    {p.email && <p className="text-[12px] text-text-tertiary">{p.email}</p>}
                    {p.workplace && <p className="text-[12px] text-text-tertiary">{p.workplace}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1 text-[13px] text-text-tertiary">
                {child.fatherName && <p><span className="font-medium text-text-primary">Отец:</span> {child.fatherName}</p>}
                {child.motherName && <p><span className="font-semibold text-text-primary">Мать:</span> {child.motherName}</p>}
                {child.parentPhone && <p><span className="font-semibold text-text-primary">Тел:</span> {child.parentPhone}</p>}
                {!child.fatherName && !child.motherName && <p>Информация о родителях не указана</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Здоровье */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-macos-red" />
              Здоровье и рацион
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HealthBlock info={child.healthInfo as HealthInfo | null} />
          </CardContent>
        </Card>

        {/* Договоры */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-macos-purple" />
              Договоры
            </CardTitle>
          </CardHeader>
          <CardContent>
            {child.contracts && child.contracts.length > 0 ? (
              <div className="space-y-2">
                {child.contracts.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center border-b border-separator/30 pb-2 last:border-b-0">
                    <span className="font-medium text-[13px] text-text-primary">
                      №{c.number} от {new Date(c.date).toLocaleDateString('ru-RU')}
                    </span>
                    {c.isActive && <Badge variant="success" dot>Активен</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <dl className="space-y-1">
                <Row label="№ договора" value={child.contractNumber || '—'} />
                <Row label="Дата договора" value={child.contractDate ? new Date(child.contractDate).toLocaleDateString('ru-RU') : '—'} />
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Кружки */}
        {child.enrollments && child.enrollments.length > 0 && (
          <Card variant="glass" className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-macos-blue" />
                Посещаемые кружки и секции
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {child.enrollments.map((e) => (
                  <Badge key={e.id} variant="default" dot>
                    {e.club.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageSection>

      {/* Документы ученика */}
      <PageSection>
        <StudentDocumentsSection childId={child.id} childName={fullName} />
      </PageSection>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Редактировать данные ученика"
        eyebrow="Профиль ученика"
        description="Изменения в карточке ребёнка собраны по блокам для быстрой проверки персональных данных."
        icon={<Edit className="h-5 w-5 text-macos-blue" />}
        size="xl"
      >
        <ChildForm
          initialData={child}
          onSuccess={() => { setIsEditOpen(false); refresh(); }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      {/* Absences Modal */}
      <Modal
        isOpen={showAbsences}
        onClose={() => setShowAbsences(false)}
        title={`Отсутствия — ${fullName}`}
        eyebrow="Журнал посещаемости"
        description="История отсутствий ученика с возможностью добавления новых записей."
        icon={<CalendarX className="h-5 w-5 text-macos-orange" />}
        size="lg"
      >
        <ModalNotice title="Контекст" tone="info">
          Проверяйте даты и причину отсутствия перед сохранением.
        </ModalNotice>
        <ModalSection title="Записи по ученику">
          <AbsencesView childId={child.id} />
        </ModalSection>
      </Modal>
    </PageStack>
  );
}

