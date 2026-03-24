// src/components/dashboard/widgets/CalendarTodayWidget.tsx
import { Clock, MapPin } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  type: string;
}

interface CalendarTodayData {
  date: string;
  events: CalendarEvent[];
}

const TYPE_COLORS: Record<string, string> = {
  lesson: 'border-l-blue-500',
  meeting: 'border-l-purple-500',
  event: 'border-l-green-500',
  holiday: 'border-l-red-500',
  deadline: 'border-l-amber-500',
};

export default function CalendarTodayWidget({ data }: { data: CalendarTodayData | undefined }) {
  if (!data) return null;

  const timeFmt = (iso: string) =>
    new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-2">
      {data.events.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">Нет событий на сегодня</p>
      )}

      {data.events.map(ev => (
        <div
          key={ev.id}
          className={`border-l-2 pl-3 py-1.5 ${TYPE_COLORS[ev.type] ?? 'border-l-gray-300'}`}
        >
          <p className="text-sm font-medium leading-tight">{ev.title}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeFmt(ev.startTime)} – {timeFmt(ev.endTime)}
            </span>
            {ev.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {ev.location}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
