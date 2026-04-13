import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bug, Eye, MessageCircleWarning, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/DataTable/DataTable";
import { Modal, ModalActions, ModalNotice, ModalSection } from "../components/Modal";
import { BugReportForm } from "../components/forms/BugReportForm";
import { FeedbackResponseForm } from "../components/forms/FeedbackResponseForm";
import { EmptyListState, ErrorState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/input";
import { LoadingCard } from "../components/ui/LoadingState";
import { PageHeader, PageSection, PageStack, PageToolbar } from "../components/ui/page";
import { Button } from "../components/ui/button";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import type { Feedback, FeedbackStatus } from "../types/feedback";

const STATUS_OPTIONS: Array<{ value: "ALL" | FeedbackStatus; label: string }> = [
  { value: "ALL", label: "Все статусы" },
  { value: "NEW", label: "Новые" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "RESOLVED", label: "Решённые" },
];

const statusLabels: Record<FeedbackStatus, string> = {
  NEW: "Новое",
  IN_PROGRESS: "В работе",
  RESOLVED: "Решено",
};

export default function FeedbackPage() {
  const { user } = useAuth();
  const canManageFeedback = ["DEVELOPER", "DIRECTOR", "DEPUTY", "ADMIN"].includes(user?.role || "");
  const { data, total, page, setPage, fetchData, loading, error } = useApi<Feedback>({
    url: "/api/feedback",
    filters: { type: "Баг-репорт" },
    enabled: canManageFeedback,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | FeedbackStatus>("ALL");
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [previewFeedback, setPreviewFeedback] = useState<Feedback | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingFeedback, setDeletingFeedback] = useState<Feedback | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const haystack = [item.parentName, item.contactInfo, item.message, item.response, item.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [data, search, statusFilter]);

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsResponseModalOpen(true);
  };

  const openDeleteModal = (feedback: Feedback) => {
    setDeletingFeedback(feedback);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFeedback) return;
    setDeleting(true);
    try {
      await api.delete(`/api/feedback/${deletingFeedback.id}`);
      toast.success("Обращение удалено");
      setDeleteModalOpen(false);
      setDeletingFeedback(null);
      await fetchData();
    } catch (error: any) {
      toast.error("Ошибка удаления", { description: error?.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = async () => {
    setIsResponseModalOpen(false);
    if (canManageFeedback) {
      await fetchData();
    }
    toast.success("Изменения сохранены");
  };

  const handleBugReportSuccess = async () => {
    if (canManageFeedback) {
      await fetchData();
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    const styles = {
      NEW: "bg-[rgba(0,122,255,0.12)] text-blue-800",
      IN_PROGRESS: "bg-[rgba(255,204,0,0.12)] text-yellow-800",
      RESOLVED: "bg-[rgba(52,199,89,0.12)] text-green-800",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{statusLabels[status]}</span>;
  };

  const columns: Column<Feedback>[] = [
    { key: "id", header: "ID" },
    {
      key: "status",
      header: "Статус",
      render: (row) => getStatusBadge(row.status),
    },
    { key: "type", header: "Тип" },
    { key: "parentName", header: "Автор" },
    { key: "contactInfo", header: "Контакты" },
    {
      key: "message",
      header: "Описание",
      render: (row) => `${row.message.substring(0, 80)}${row.message.length > 80 ? "..." : ""}`,
    },
    {
      key: "createdAt",
      header: "Создано",
      render: (row) => new Date(row.createdAt).toLocaleDateString("ru-RU"),
    },
    {
      key: "actions",
      header: "Действия",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.status !== "RESOLVED" ? (
            <Button variant="outline" size="sm" onClick={() => handleRespond(row)}>
              Ответить
            </Button>
          ) : null}
          {row.response ? (
            <Button variant="ghost" size="sm" onClick={() => setPreviewFeedback(row)}>
              <Eye className="h-4 w-4" />
              Просмотр
            </Button>
          ) : null}
          <Button variant="destructive" size="sm" onClick={() => openDeleteModal(row)}>
            Удалить
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (!canManageFeedback) return;
    fetchData();
  }, [canManageFeedback]);

  return (
    <PageStack>
      <PageHeader
        eyebrow="Качество продукта"
        title="Баг-репорты"
        icon={<Bug className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral">{canManageFeedback ? total : "Новый репорт"}</span>}
        description="Форма отправки и административный журнал баг-репортов приведены к одному рабочему ритму: отправка, разбор, ответ и удаление теперь живут в одной системе экранов."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <PageSection>
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
              <MessageCircleWarning className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Новый баг-репорт</h2>
              <p className="text-sm text-secondary">
                Чем точнее сценарий и ожидаемое поведение, тем быстрее получится воспроизвести и исправить проблему.
              </p>
            </div>
          </div>
          <BugReportForm onSuccess={handleBugReportSuccess} />
        </PageSection>

        <div className="space-y-4">
          <PageSection inset>
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <h3 className="font-semibold text-amber-950">Что попадёт разработчику</h3>
                <p className="mt-1 text-sm text-amber-900">
                  Заголовок, критичность, текущая страница, описание проблемы, шаги воспроизведения и техническая информация о браузере.
                </p>
              </div>
            </div>
          </PageSection>

          <PageSection inset>
            <h3 className="font-semibold text-slate-900">Перед отправкой</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Укажите страницу, где воспроизводится ошибка.</li>
              <li>Опишите, что вы ожидали увидеть.</li>
              <li>Если ошибка повторяется, добавьте пошаговый сценарий.</li>
            </ul>
          </PageSection>
        </div>
      </div>

      {canManageFeedback ? (
        <>
          <PageToolbar>
            <div className="mezon-toolbar-group">
              <div className="mezon-input-shell">
                <Search className="mezon-input-shell__icon h-4 w-4" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по автору, контактам или описанию"
                  className="min-w-[280px]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "ALL" | FeedbackStatus)}
                className="mezon-field"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </PageToolbar>

          <DataTable
            title="Журнал баг-репортов"
            description="Административный обзор отправленных сообщений для разбора, ответа и безопасного удаления по единому паттерну."
            toolbar={<span className="mezon-data-table__toolbar-pill">После фильтров: {filteredData.length}</span>}
            columns={columns}
            data={filteredData}
            page={page}
            pageSize={10}
            total={filteredData.length}
            onPageChange={setPage}
            wrapCells
            density="compact"
            emptyState={
              loading ? (
                <LoadingCard message="Загружаем баг-репорты..." height={220} />
              ) : error ? (
                <ErrorState message={error.message} onRetry={fetchData} className="py-10" />
              ) : (
                <EmptyListState
                  title="Баг-репорты не найдены"
                  description="Измените фильтры или дождитесь новых обращений."
                  className="py-10"
                />
              )
            }
          />
        </>
      ) : null}

      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Ответ на баг-репорт"
        eyebrow="Разбор обращения"
        description="Перед ответом проверьте исходный баг-репорт, затем зафиксируйте понятный ответ и актуальный статус."
        icon={<MessageCircleWarning className="h-5 w-5" />}
        size="xl"
        meta={selectedFeedback ? getStatusBadge(selectedFeedback.status) : null}
      >
        {selectedFeedback ? (
          <FeedbackResponseForm
            feedback={selectedFeedback}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsResponseModalOpen(false)}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={!!previewFeedback}
        onClose={() => setPreviewFeedback(null)}
        title="Ответ на обращение"
        eyebrow="История коммуникации"
        description="Просмотр текущего ответа без перехода к редактированию."
        icon={<Eye className="h-5 w-5" />}
      >
        {previewFeedback ? (
          <div className="mezon-modal-form">
            <ModalSection title="Карточка обращения" description="Краткий контекст перед просмотром ответа.">
              <div className="mezon-modal-facts">
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Автор</span>
                  <span className="mezon-modal-fact__value">{previewFeedback.parentName}</span>
                </div>
                <div className="mezon-modal-fact">
                  <span className="mezon-modal-fact__label">Статус</span>
                  <span className="mezon-modal-fact__value">{statusLabels[previewFeedback.status]}</span>
                </div>
              </div>
            </ModalSection>
            <ModalNotice title="Ответ" tone="info">
              {previewFeedback.response}
            </ModalNotice>
            <div className="mezon-modal-inline-actions">
              <Button type="button" variant="ghost" onClick={() => setPreviewFeedback(null)}>
                Закрыть
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удаление баг-репорта"
        eyebrow="Опасное действие"
        description="Обращение исчезнет из журнала навсегда. Перед удалением проверьте автора, тип и фрагмент сообщения."
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!deleting}
        closeOnEscape={!deleting}
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Удаление..." : "Удалить"}
            </Button>
          </ModalActions>
        }
      >
        <ModalNotice title="Удаление необратимо" tone="danger">
          После подтверждения обращение, история статусов и ответ будут удалены из административного журнала.
        </ModalNotice>

        {deletingFeedback ? (
          <ModalSection title="Карточка обращения" description="Сверьте данные, чтобы не удалить чужой или уже разобранный репорт.">
            <div className="mezon-modal-facts">
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Автор</span>
                <span className="mezon-modal-fact__value">{deletingFeedback.parentName}</span>
              </div>
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Тип</span>
                <span className="mezon-modal-fact__value">{deletingFeedback.type}</span>
              </div>
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Контакты</span>
                <span className="mezon-modal-fact__value">{deletingFeedback.contactInfo}</span>
              </div>
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Статус</span>
                <span className="mezon-modal-fact__value">{statusLabels[deletingFeedback.status]}</span>
              </div>
            </div>

            <ModalNotice title="Фрагмент сообщения" tone="warning">
              {deletingFeedback.message.substring(0, 160)}
              {deletingFeedback.message.length > 160 ? "..." : ""}
            </ModalNotice>
          </ModalSection>
        ) : null}
      </Modal>
    </PageStack>
  );
}
