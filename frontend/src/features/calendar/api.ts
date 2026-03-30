import { api } from "../../lib/api";
import type { CalendarEvent } from "../../types/calendar";

export interface GroupOption {
  id: number;
  name: string;
}

export interface CreateEventPayload {
  title: string;
  date: string;
  groupId: number | null;
  organizer: string;
  performers: string[];
}

export type UpdateEventPayload = CreateEventPayload;

export function fetchCalendarEvents(params?: { startDate?: string; endDate?: string }) {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  const qs = query.toString();
  return api.get<CalendarEvent[]>(`/api/calendar${qs ? `?${qs}` : ""}`);
}

export function fetchCalendarGroups() {
  return api.get<GroupOption[]>("/api/calendar/groups");
}

export function createCalendarEvent(payload: CreateEventPayload) {
  return api.post<CalendarEvent>("/api/calendar", payload);
}

export function updateCalendarEvent(id: number, payload: UpdateEventPayload) {
  return api.put<CalendarEvent>(`/api/calendar/${id}`, payload);
}

export function deleteCalendarEvent(id: number) {
  return api.delete(`/api/calendar/${id}`);
}
