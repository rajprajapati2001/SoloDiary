import React, { useState } from 'react';
import { ActivityEntry, Goal } from '../types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CalendarViewProps {
  entries: ActivityEntry[];
  goals: Goal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onMonthChange?: (month: string, year: string) => void;
  disableActiveHighlight?: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, goals, selectedDate, onSelectDate, onMonthChange, disableActiveHighlight = false, }) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) return new Date(selectedDate);
    return new Date();
  });

  // Sync internal month when selectedDate prop changes from outside (e.g. from StatsView selectors)
  React.useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (d.getMonth() !== currentMonth.getMonth() || d.getFullYear() !== currentMonth.getFullYear()) {
        setCurrentMonth(d);
      }
    }
  }, [selectedDate]);

  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const pointsByDate: Record<string, number> = entries.reduce((acc, entry) => {
    const entryDate = entry.fromDate || entry.toDate;
    acc[entryDate] = (acc[entryDate] || 0) + entry.points;
    return acc;
  }, {} as Record<string, number>);

  const handlePrev = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentMonth(newDate);
    onMonthChange?.(String(newDate.getMonth() + 1).padStart(2, '0'), newDate.getFullYear().toString());
  };

  const handleNext = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentMonth(newDate);
    onMonthChange?.(String(newDate.getMonth() + 1).padStart(2, '0'), newDate.getFullYear().toString());
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <Calendar className="text-blue-500" size={30} />
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex gap-2 dark:text-white text-black">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNext} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">{d}</div>
        ))}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const points = pointsByDate[dateStr] || 0;
          const isActive = !disableActiveHighlight && selectedDate === dateStr;
          const hasAchievedGoal = goals.some(g => g.achievedAt === dateStr);

          // Determine badge color for the point values
          let badgeClass = '';
          if (isActive || hasAchievedGoal) {
            badgeClass = 'bg-white/20 text-white';
          } else if (points < 0) {
            badgeClass = 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300';
          } else {
            badgeClass = 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300';
          }

          return (
            <button
              key={day}
              data-date={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`relative min-h-[50px] rounded-xl flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : hasAchievedGoal 
                    ? 'bg-emerald-500/50 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-sm font-bold">{day}</span>
              {points !== 0 && (
                <span className={`text-[9px] font-black mt-1 px-1 rounded ${badgeClass}`}>
                  {points > 0 ? `+${points}` : points}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;