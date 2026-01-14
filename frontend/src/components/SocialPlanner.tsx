import React, { useRef, useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Star, Heart, Sparkles, Music, Coffee, Sun, Moon, Cloud } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Event } from '../types/calendar';

interface SocialPlannerProps {
  events: Event[];
  month?: Date;
  onEdit?: (event: Event) => void;
}

// Pastel color palette for sticky notes
const stickyColors = [
  { bg: '#f9efe8', border: '#e8ddd4' },  // Peach/Cream
  { bg: '#e6fbf1', border: '#c9e8d9' },  // Mint
  { bg: '#fff3e6', border: '#ffe0c2' },  // Light Orange
  { bg: '#f0e6ff', border: '#d9c9f0' },  // Lavender
  { bg: '#fff9e6', border: '#f0e6c2' },  // Light Yellow
  { bg: '#e6f4ff', border: '#c9e0f0' },  // Light Blue
  { bg: '#ffe6f0', border: '#f0c9d9' },  // Light Pink
  { bg: '#f5ffe6', border: '#e0f0c9' },  // Light Lime
];

// Decorative icons for the right column
const decorativeIcons = [Star, Heart, Sparkles, Music, Coffee, Sun, Moon, Cloud];

export const SocialPlanner: React.FC<SocialPlannerProps> = ({ events, month = new Date(), onEdit }) => {
  const plannerRef = useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = useState(month);
  const [isExporting, setIsExporting] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthNamesRu = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Group days into weeks
  const getWeeks = () => {
    const weeks: { start: number; end: number; days: number[] }[] = [];
    let currentWeek: number[] = [];
    
    // Empty days before month starts
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push(0);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        const validDays = currentWeek.filter(d => d > 0);
        weeks.push({
          start: validDays[0],
          end: validDays[validDays.length - 1],
          days: currentWeek
        });
        currentWeek = [];
      }
    }
    
    // Fill last week if incomplete
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(0);
      }
      const validDays = currentWeek.filter(d => d > 0);
      weeks.push({
        start: validDays[0],
        end: validDays[validDays.length - 1],
        days: currentWeek
      });
    }
    
    return weeks;
  };

  const getDayEvents = (day: number) => {
    if (day === 0) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentMonth &&
        eventDate.getFullYear() === currentYear
      );
    });
  };

  const handleExport = async () => {
    if (!plannerRef.current) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(plannerRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#faf7f2',
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `planner-${monthNames[currentMonth].toLowerCase()}-${currentYear}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const weeks = getWeeks();
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="social-planner-wrapper">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-nunito font-semibold text-lg text-gray-700 min-w-[160px] text-center">
            {monthNamesRu[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-nunito font-semibold disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Экспорт...' : 'Скачать PNG'}
        </button>
      </div>

      {/* Planner Design Area */}
      <div
        ref={plannerRef}
        className="planner-bg rounded-2xl shadow-xl overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 3px 3px, rgba(0,0,0,0.06) 1px, transparent 1px),
            radial-gradient(circle at 3px 18px, rgba(0,0,0,0.03) 1px, transparent 1px),
            #faf7f2
          `,
          backgroundSize: '40px 40px, 40px 40px, auto',
          padding: '32px',
          minWidth: '900px',
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 
            className="font-dancing text-5xl text-gray-800 mb-2"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            {monthNames[currentMonth]}
          </h1>
          <p 
            className="font-nunito text-xl text-gray-500 tracking-widest"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            {currentYear}
          </p>
        </div>

        {/* Main Grid */}
        <div className="flex gap-6">
          {/* Left Column - Week Ranges */}
          <div className="w-24 flex flex-col gap-3 pt-10">
            {weeks.map((week, idx) => (
              <div
                key={idx}
                className="date-label px-3 py-2 rounded-lg text-center text-sm font-nunito font-semibold text-gray-600"
                style={{
                  background: 'linear-gradient(180deg, #fff, #fff)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  fontFamily: "'Nunito', sans-serif",
                  height: '88px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <span className="text-lg font-bold text-gray-700">{week.start}</span>
                <span className="text-xs text-gray-400">—</span>
                <span className="text-lg font-bold text-gray-700">{week.end}</span>
              </div>
            ))}
          </div>

          {/* Center - Calendar Grid */}
          <div className="flex-1">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {dayNames.map((day, idx) => (
                <div
                  key={idx}
                  className="text-center text-sm font-nunito font-semibold text-gray-500 uppercase tracking-wider"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks Grid */}
            <div className="flex flex-col gap-3">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-2">
                  {week.days.map((day, dayIdx) => {
                    const dayEvents = getDayEvents(day);
                    const hasEvents = dayEvents.length > 0;
                    const colorIdx = (day + weekIdx) % stickyColors.length;
                    const stickyColor = stickyColors[colorIdx];
                    const isToday = 
                      day === new Date().getDate() && 
                      currentMonth === new Date().getMonth() && 
                      currentYear === new Date().getFullYear();

                    return (
                      <div
                        key={dayIdx}
                        className={`
                          sticky-note relative p-2 h-[84px] transition-all
                          ${day === 0 ? 'bg-transparent border-transparent shadow-none' : ''}
                        `}
                        style={{
                          borderRadius: day === 0 ? '0' : '14px',
                          backgroundColor: day === 0 ? 'transparent' : hasEvents ? stickyColor.bg : '#ffffff',
                          boxShadow: day === 0 
                            ? 'none' 
                            : '0 6px 18px rgba(17,24,39,0.12), inset 0 -3px 0 rgba(0,0,0,0.03)',
                          border: day === 0 ? 'none' : `1px solid ${hasEvents ? stickyColor.border : 'rgba(0,0,0,0.03)'}`,
                          transform: hasEvents && day !== 0 ? 'rotate(-0.7deg)' : 'none',
                        }}
                      >
                        {day > 0 && (
                          <>
                            {/* Day Number */}
                            <div 
                              className={`
                                absolute top-1 right-2 font-nunito text-sm font-bold
                                ${isToday ? 'text-pink-500' : 'text-gray-400'}
                              `}
                              style={{ fontFamily: "'Nunito', sans-serif" }}
                            >
                              {day}
                            </div>

                            {/* Events */}
                            <div className="mt-4 space-y-1 overflow-hidden">
                              {dayEvents.slice(0, 2).map((event, eventIdx) => (
                                <div
                                  key={event.id}
                                  className="text-xs font-nunito text-gray-700 truncate leading-tight cursor-pointer hover:text-gray-900"
                                  style={{ fontFamily: "'Nunito', sans-serif" }}
                                  onClick={() => onEdit?.(event)}
                                  title={event.title}
                                >
                                  <span className="font-semibold">{event.title}</span>
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div 
                                  className="text-xs text-gray-400 font-nunito"
                                  style={{ fontFamily: "'Nunito', sans-serif" }}
                                >
                                  +{dayEvents.length - 2} ещё
                                </div>
                              )}
                            </div>

                            {/* Decorative element for days with events */}
                            {hasEvents && (
                              <div className="absolute bottom-1 left-2">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: stickyColors[(colorIdx + 3) % stickyColors.length].bg }}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Decorative Icons */}
          <div className="w-16 flex flex-col items-center gap-4 pt-10">
            {decorativeIcons.slice(0, weeks.length).map((Icon, idx) => {
              const iconColors = ['#f9efe8', '#e6fbf1', '#fff3e6', '#f0e6ff', '#fff9e6', '#e6f4ff'];
              return (
                <div
                  key={idx}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
                  style={{ 
                    backgroundColor: iconColors[idx % iconColors.length],
                    transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * 5}deg)`,
                  }}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: '#6b7280' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer decoration */}
        <div className="flex justify-center gap-3 mt-8">
          {[...Array(5)].map((_, idx) => (
            <div
              key={idx}
              className="w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: stickyColors[idx % stickyColors.length].bg,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialPlanner;
