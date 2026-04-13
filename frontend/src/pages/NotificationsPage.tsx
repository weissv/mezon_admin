import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BellRing, FileText, Megaphone, PlusCircle, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { DataTable, type Column } from "../components/DataTable/DataTable";
import { Modal, ModalActions, ModalNotice, ModalSection } from "../components/Modal";
import { EmptyListState, ErrorState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/input";
import { LoadingCard } from "../components/ui/LoadingState";
import { PageHeader, PageStack, PageToolbar } from "../components/ui/page";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { api } from "../lib/api";
import { ROLE_LABELS } from "../lib/constants";

type SystemNotification = {
  type: "CONTRACT_EXPIRING" | "MEDICAL_CHECKUP_DUE";
  message: string;
  employeeId: number;
  date: string;
};

type Broadcast = {
  id: number;
  title: string;
  content: string;
  targetRole?: keyof typeof ROLE_LABELS | null;
  targetGroup?: { id: number; name: string } | null;
  createdAt: string;
};

type Group = { id: number; name: string };

const iconMap: Record<SystemNotification["type"], string> = {
  CONTRACT_EXPIRING: "Контракт",
  MEDICAL_CHECKUP_DUE: "Медосмотр",
};

const ROLE_OPTIONS = [{ value: "", label: "Все роли" }].concat(
  Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
);

const broadcastFormId = "broadcast-form";

export default function NotificationsPage() {
  const { user } = useAuth();
  const canManageBroadcasts = useMemo(
    () => !!user && ["DIRECTOR", "DEPUTY", "ADMIN"].includes(user.role),
    [user],
  );

  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [systemLoading, setSystemLoading] = useState(true);
  const [systemError, setSystemError] = useState<string | null>(null);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [broadcastLoading, setBroadcastLoading] = useState(true);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [formState, setFormState] = useState({
    title: "",
    content: "",
    targetRole: "",
    targetGroupId: "",
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Broadcast | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSystemNotifications = async () => {
    setSystemLoading(true);
    setSystemError(null);
    try {
      const response = await api.get("/api/notifications");
      setSystemNotifications(response || []);
    } catch (error: any) {
      const message = error?.message || "Не удалось загрузить уведомления";
      setSystemError(message);
      toast.error("Не удалось загрузить уведомления", { description: message });
    } finally {
      setSystemLoading(false);
    }
  };

  const loadBroadcasts = async () => {
    setBroadcastLoading(true);
    setBroadcastError(null);
    try {
      const response = await api.get("/api/notifications/broadcasts");
      setBroadcasts(response || []);
    } catch (error: any) {
      const message = error?.message || "Не удалось загрузить объявления";
      setBroadcastError(message);
      toast.error("Не удалось загрузить объявления", { description: message });
    } finally {
      setBroadcastLoading(false);
    }
  };

  useEffect(() => {
    loadSystemNotifications();
    loadBroadcasts();
  }, []);

  useEffect(() => {
    if (!canManageBroadcasts) return;
    const loadGroups = async () => {
      try {
        const data = await api.get("/api/groups");
        setGroups(data || []);
      } catch (error: any) {
        toast.error("Классы недоступны", { description: error?.message });
      }
    };
    loadGroups();
  }, [canManageBroadcasts]);

  const resetForm = () => {
    setFormState({ title: "", content: "", targetRole: "", targetGroupId: "" });
  };

  const filteredBroadcasts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return broadcasts.filter((broadcast) => {
      const matchesRole = !roleFilter || broadcast.targetRole === roleFilter;
      const haystack = [
        broadcast.title,
        broadcast.content,
        broadcast.targetGroup?.name,
        broadcast.targetRole ? ROLE_LABELS[broadcast.targetRole] : "Все",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesRole && (!query || haystack.includes(query));
    });
  }, [broadcasts, roleFilter, search]);

  const handleCreateBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.title.trim() || !formState.content.trim()) {
      toast.error("Заполните заголовок и текст объявления");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: formState.title.trim(),
        content: formState.content.trim(),
        targetRole: formState.targetRole || null,
        targetGroupId: formState.targetGroupId ? Number(formState.targetGroupId) : null,
      };
      const created = await api.post("/api/notifications/broadcasts", payload);
      setBroadcasts((prev) => [created, ...prev]);
      toast.success("Объявление отправлено");
      resetForm();
      setCreateModalOpen(false);
    } catch (error: any) {
      toast.error("Не удалось отправить объявление", { description: error?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBroadcast = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/notifications/broadcasts/${deleteConfirm.id}`);
      setBroadcasts((prev) => prev.filter((item) => item.id !== deleteConfirm.id));
      toast.success("Объявление удалено");
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error("Не удалось удалить", { description: error?.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const systemColumns: Column<SystemNotification>[] = [
    {
      key: "type",
      header: "Тип",
      render: (row) => <span className="mezon-data-table__toolbar-pill">{iconMap[row.type]}</span>,
    },
    { key: "message", header: "Сообщение" },
    {
      key: "date",
      header: "Дата",
      render: (row) => new Date(row.date).toLocaleDateString("ru-RU"),
    },
  ];

  const broadcastColumns: Column<Broadcast>[] = [
    { key: "title", header: "Заголовок" },
    {
      key: "content",
      header: "Сообщение",
      render: (row) => <span className="whitespace-pre-line">{row.content}</span>,
    },
    {
      key: "targetRole",
      header: "Роль",
      render: (row) => (row.targetRole ? ROLE_LABELS[row.targetRole] : "Все роли"),
    },
    {
      key: "targetGroup",
      header: "Класс",
      render: (row) => row.targetGroup?.name || "Все классы",
    },
    {
      key: "createdAt",
      header: "Создано",
      render: (row) => new Date(row.createdAt).toLocaleString("ru-RU"),
    },
    {
      key: "actions",
      header: "Действия",
      render: (row) =>
        canManageBroadcasts ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirm(row)}
            aria-label={`Удалить объявление ${row.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <PageStack>
      <PageHeader
        eyebrow="Коммуникации"
        title="Уведомления и объявления"
        icon={<Megaphone className="h-5 w-5" />}
        meta={<span className="mezon-badge macos-badge-neutral">{broadcasts.length} объявлений</span>}
        description="Системные напоминания и массовые объявления сведены в один плотный операторский экран: отдельно видны срочные сигналы и история рассылок."
        actions={
          canManageBroadcasts ? (
            <Button onClick={() => setCreateModalOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Новое объявление
            </Button>
          ) : undefined
        }
      />

      <DataTable
        title="Системные напоминания"
        description="Сигналы по срокам и кадровым событиям, которые требуют внимания в ближайшее время."
        columns={systemColumns}
        data={systemNotifications}
        page={1}
        pageSize={Math.max(systemNotifications.length || 1, 1)}
        total={systemNotifications.length}
        onPageChange={() => {}}
        density="compact"
        wrapCells
        emptyState={
          systemLoading ? (
            <LoadingCard message="Загружаем напоминания..." height={180} />
          ) : systemError ? (
            <ErrorState message={systemError} onRetry={loadSystemNotifications} className="py-10" />
          ) : (
            <EmptyListState
              title="Нет предстоящих событий"
              description="Система пока не нашла договоры или медосмотры, требующие внимания."
              className="py-10"
            />
          )
        }
      />

      <PageToolbar>
        <div className="mezon-toolbar-group">
          <div className="mezon-input-shell">
            <Search className="mezon-input-shell__icon h-4 w-4" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по объявлениям"
              className="min-w-[280px]"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="mezon-field"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </PageToolbar>

      <DataTable
        title="История массовых объявлений"
        description="Обзор последних рассылок по ролям и классам с единым форматом удаления и быстрым поиском по содержимому."
        toolbar={<span className="mezon-data-table__toolbar-pill">После фильтров: {filteredBroadcasts.length}</span>}
        columns={broadcastColumns}
        data={filteredBroadcasts}
        page={1}
        pageSize={Math.max(filteredBroadcasts.length || 1, 1)}
        total={filteredBroadcasts.length}
        onPageChange={() => {}}
        density="compact"
        wrapCells
        emptyState={
          broadcastLoading ? (
            <LoadingCard message="Загружаем объявления..." height={220} />
          ) : broadcastError ? (
            <ErrorState message={broadcastError} onRetry={loadBroadcasts} className="py-10" />
          ) : (
            <EmptyListState
              title="История объявлений пуста"
              description="Создайте первое объявление, чтобы журнал рассылок появился на странице."
              onAction={canManageBroadcasts ? () => setCreateModalOpen(true) : undefined}
              actionLabel="Новое объявление"
              className="py-10"
            />
          )
        }
      />

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Новое объявление"
        eyebrow="Коммуникации"
        description="Короткий сценарий для рассылки административного сообщения по ролям и классам."
        icon={<Megaphone className="h-5 w-5" />}
        size="xl"
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={saving}>
              Отмена
            </Button>
            <Button form={broadcastFormId} type="submit" disabled={saving}>
              {saving ? "Отправляем..." : "Отправить"}
            </Button>
          </ModalActions>
        }
      >
        <form id={broadcastFormId} className="mezon-modal-form" onSubmit={handleCreateBroadcast}>
          <ModalSection title="Канал объявления" description="Задайте заголовок и сузьте аудиторию, если сообщение не для всех сотрудников и классов.">
            <div>
              <label className="mezon-form-label">Заголовок</label>
              <Input
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Например, Инструктаж по пожарной безопасности"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mezon-form-label">Роль</label>
                <select
                  value={formState.targetRole}
                  onChange={(event) => setFormState((prev) => ({ ...prev, targetRole: event.target.value }))}
                  className="mezon-field"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mezon-form-label">Класс</label>
                <select
                  value={formState.targetGroupId}
                  onChange={(event) => setFormState((prev) => ({ ...prev, targetGroupId: event.target.value }))}
                  className="mezon-field"
                >
                  <option value="">Все классы</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ModalSection>

          <ModalSection title="Текст сообщения" description="Сделайте сообщение коротким и понятным, чтобы оно читалось как служебное объявление, а не длинная переписка.">
            <div>
              <label className="mezon-form-label">Сообщение</label>
              <textarea
                value={formState.content}
                onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                className="mezon-field mezon-textarea"
                rows={5}
                placeholder="Коротко опишите событие, сроки и следующие действия..."
              />
            </div>
          </ModalSection>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Удаление объявления"
        eyebrow="Опасное действие"
        description="Объявление исчезнет из административной истории рассылок без возможности восстановления."
        icon={<AlertTriangle className="h-5 w-5" />}
        tone="danger"
        closeOnBackdrop={!isDeleting}
        closeOnEscape={!isDeleting}
        footer={
          <ModalActions>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteBroadcast} disabled={isDeleting}>
              {isDeleting ? "Удаление..." : "Удалить"}
            </Button>
          </ModalActions>
        }
      >
        <ModalNotice title="Удаление необратимо" tone="danger">
          После подтверждения запись о рассылке будет удалена из журнала. Убедитесь, что объявление больше не нужно для истории.
        </ModalNotice>
        {deleteConfirm ? (
          <ModalSection title="Проверка объявления" description="Сверьте заголовок и аудиторию перед удалением.">
            <div className="mezon-modal-facts">
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Заголовок</span>
                <span className="mezon-modal-fact__value">{deleteConfirm.title}</span>
              </div>
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Роль</span>
                <span className="mezon-modal-fact__value">
                  {deleteConfirm.targetRole ? ROLE_LABELS[deleteConfirm.targetRole] : "Все роли"}
                </span>
              </div>
              <div className="mezon-modal-fact">
                <span className="mezon-modal-fact__label">Класс</span>
                <span className="mezon-modal-fact__value">{deleteConfirm.targetGroup?.name || "Все классы"}</span>
              </div>
            </div>
          </ModalSection>
        ) : null}
      </Modal>
    </PageStack>
  );
}
