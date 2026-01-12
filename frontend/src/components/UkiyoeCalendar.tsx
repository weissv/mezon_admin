import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Event } from '../types/calendar';

interface UkiyoeCalendarProps {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}

export const UkiyoeCalendar: React.FC<UkiyoeCalendarProps> = ({ events, onEdit, onDelete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Ukiyo-e Color Palette
  const colors = {
    paper: '#fcf1e3', // Washi paper
    indigo: '#1d3b56', // Prussian Blue
    red: '#d65b5b',    // Traditional Red
    black: '#2c2c2c',  // Sumi Ink
    gold: '#e6b422',   // Gold leaf accent
    green: '#5c7a65',  // Pine green
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    return day === 0 ? 6 : day - 1; 
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getDayEvents = (day: number) => {
    const targetDate = new Date(currentYear, currentMonth, day);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    });
  };

  const renderCalendarCells = () => {
    const cells = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        cells.push(<div key={`empty-${i}`} className="h-32 border-r border-b border-[#1d3b56]/20 bg-[#f9ecdb]"></div>);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEvents = getDayEvents(day);
        const isToday = 
            day === new Date().getDate() && 
            currentMonth === new Date().getMonth() && 
            currentYear === new Date().getFullYear();

        cells.push(
            <div 
                key={day} 
                className={`h-32 p-2 border-r border-b border-[#1d3b56]/30 relative transition-all hover:bg-[#fffdf9] group overflow-hidden
                    ${isToday ? 'bg-[#fff5e6]' : 'bg-transparent'}
                `}
            >
                {/* Day Number */}
                <div className={`
                    absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full font-serif text-lg
                    ${isToday ? 'bg-[#d65b5b] text-[#fcf1e3] font-bold shadow-sm' : 'text-[#1d3b56]'}
                `}>
                    {day}
                </div>

                {/* Day Decoration (Wave pattern feeling) */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#1d3b56]/10"></div>

                {/* Events */}
                <div className="mt-8 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)] pr-1 custom-scrollbar">
                    {dayEvents.map(event => (
                        <div 
                            key={event.id}
                            onClick={() => onEdit(event)}
                            className="text-xs p-1.5 rounded cursor-pointer border-l-2 shadow-sm hover:shadow-md transition-all font-serif group/event flex justify-between items-center bg-white border-l-[#1d3b56] text-[#2c2c2c] hover:bg-gray-50"
                            title={`${event.title}${event.group ? ` (${event.group.name})` : ''}\nОрганизатор: ${event.organizer}${event.performers?.length ? `\nИсполнители: ${event.performers.join(', ')}` : ''}`}
                        >
                            <span className="truncate flex-1">{event.title}</span>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(event);
                                }}
                                className="opacity-0 group-hover/event:opacity-100 p-0.5 hover:bg-red-100 rounded text-red-500 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return cells;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 rounded-lg shadow-2xl relative overflow-hidden"
         style={{
             backgroundColor: colors.paper,
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d6a06d' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             border: `12px solid ${colors.indigo}`
         }}
    >
        {/* Inner Border Frame */}
        <div className="absolute inset-2 border-2 border-[#d65b5b]/40 pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative z-10 border-b-2 border-[#1d3b56] pb-4">
        <div className="flex items-center gap-4">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-[#1d3b56]/10 rounded-full transition-colors">
                <ChevronLeft className="w-8 h-8" style={{ color: colors.indigo }} />
            </button>
            <h2 className="text-4xl font-serif font-bold tracking-wider uppercase" style={{ color: colors.indigo }}>
                {monthNames[currentMonth]} <span className="text-[#d65b5b]">{currentYear}</span>
            </h2>
            <button onClick={handleNextMonth} className="p-2 hover:bg-[#1d3b56]/10 rounded-full transition-colors">
                <ChevronRight className="w-8 h-8" style={{ color: colors.indigo }} />
            </button>
        </div>
        
        {/* Decorative Element */}
        <div className="hidden md:block">
             <div className="flex items-center gap-2 px-4 py-2 border border-[#1d3b56] rounded bg-[#fffdf9]">
                 <CalendarIcon className="w-5 h-5" style={{ color: colors.red }} />
                 <span className="font-serif text-[#1d3b56]">Календарь событий</span>
             </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-0 border-t-2 border-l-2 border-r-2 border-[#1d3b56] bg-[#1d3b56] text-[#fcf1e3]">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className="py-3 text-center font-bold font-serif tracking-widest text-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 border-l-2 border-t border-[#1d3b56] bg-[#fcf1e3]/50 backdrop-blur-sm">
        {renderCalendarCells()}
      </div>

      {/* Footer / Legend Decoration */}
      <div className="mt-6 flex justify-center items-center gap-8 font-serif text-sm opacity-80" style={{ color: colors.indigo }}>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#d65b5b]"></div> Today
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-l-2 border-[#1d3b56] bg-white"></div> Event
            </div>
      </div>
    </div>
  );
};
