// src/components/dashboard/widgets/CalendarTodayWidget.tsx
import { Clock, User } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  organizer?: string;
  type: string;
}

interface CalendarTodayData {
  date: string;
  events: CalendarEvent[];
}

const TYPE_STRIPE: Record<string, string> = {
  lesson:   '#3B82F6',
  meeting:  '#8B5CF6',
  event:    '#10B981',
  holiday:  '#EF4444',
  deadline: '#F59E0B',
};

const timeFmt = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export default function CalendarTodayWidget({ data }: { data: CalendarTodayData | undefined }) {
  if (!data) return null;

  const events = data.events ?? [];

  return (
    <div className="flex flex-col gap-2 h-full">
      {events.length === 0 ? (
        <div className="p-4 text-center text-text-tertiary text-[12px] my-auto">
          На сегодня событий не запланировано
        </div>
      ) : (
        events.map(ev => (
          <div
            key={ev.id}
            className="flex items-stretch gap-2.5 p-2.5 rounded-xl bg-surface-primary/70 dark:bg-slate-800/40 border border-separator/30 hover:bg-surface-primary transition-all text-[12px]"
          >
            <div
              className="w-1 rounded-full shrink-0"
              style={{ background: TYPE_STRIPE[ev.type] ?? '#94A3B8' }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary truncate leading-tight">{ev.title}</p>
              <div className="flex items-center gap-3 text-[10px] text-text-tertiary mt-1 leading-tight">
                <span className="flex items-center gap-1 tabular-nums">
                  <Clock className="h-3 w-3 opacity-70" />
                  {timeFmt(ev.startTime)}
                </span>
                {ev.organizer && (
                  <span className="flex items-center gap-1 truncate">
                    <User className="h-3 w-3 opacity-70" />
                    {ev.organizer}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
