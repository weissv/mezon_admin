// Calendar/Event types
export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  groupId: number | null;
  group?: { id: number; name: string } | null;
  organizer: string;
  performers: string[];
  createdAt: string;
}

/** @deprecated Use CalendarEvent instead */
export type Event = CalendarEvent;
