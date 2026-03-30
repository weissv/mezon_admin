import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { fetchCalendarEvents, deleteCalendarEvent } from "./api";
import type { CalendarEvent } from "../../types/calendar";

export interface UseCalendarReturn {
  events: CalendarEvent[];
  loading: boolean;
  editingEvent: CalendarEvent | null;
  deleteTarget: CalendarEvent | null;
  isDeleting: boolean;
  isModalOpen: boolean;
  refresh: () => Promise<void>;
  openCreate: () => void;
  openEdit: (event: CalendarEvent) => void;
  closeModal: () => void;
  requestDelete: (event: CalendarEvent) => void;
  cancelDelete: () => void;
  confirmDelete: () => Promise<void>;
}

export function useCalendar(): UseCalendarReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCalendarEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ошибка загрузки данных";
      toast.error("Ошибка загрузки событий", { description: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = useCallback(() => {
    setEditingEvent(null);
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const requestDelete = useCallback((event: CalendarEvent) => {
    setDeleteTarget(event);
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCalendarEvent(deleteTarget.id);
      toast.success("Событие удалено");
      setDeleteTarget(null);
      await refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка";
      toast.error("Ошибка удаления", { description: message });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, refresh]);

  return {
    events,
    loading,
    editingEvent,
    deleteTarget,
    isDeleting,
    isModalOpen,
    refresh,
    openCreate,
    openEdit,
    closeModal,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}
