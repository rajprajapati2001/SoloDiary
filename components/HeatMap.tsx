import React, { useMemo } from 'react';
import { ActivityEntry } from '../types';

export interface HeatMapDay {
  dateStr: string;
  isCurrentYear: boolean;
  count: number;
  points: number;
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
}

interface HeatMapProps {
  year?: number;
  entries?: ActivityEntry[];
  customData?: { date: string; count?: number; points: number }[];
  onDayClick?: (dateStr: string, points: number, count: number) => void;
  themeColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue';
  maxMonth?: number; // 0-indexed (0 is Jan, 11 is Dec)
}

const themeColors = {
  indigo: {
    full: 'bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.4)]',
    high: 'bg-indigo-500/75 dark:bg-indigo-500/80',
    med: 'bg-indigo-500/45 dark:bg-indigo-500/50',
    low: 'bg-indigo-500/20 dark:bg-indigo-200/20',
    activeBorder: 'border-[0.5px] border-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400'
  },
  emerald: {
    full: 'bg-emerald-600 dark:bg-emerald-400 shadow-[0_0_4px_rgba(16,185,129,0.4)]',
    high: 'bg-emerald-500/75 dark:bg-emerald-500/80',
    med: 'bg-emerald-500/45 dark:bg-emerald-500/50',
    low: 'bg-emerald-500/20 dark:bg-emerald-200/20',
    activeBorder: 'border-[0.5px] border-emerald-500/10',
    text: 'text-emerald-650 dark:text-emerald-400'
  },
  amber: {
    full: 'bg-amber-500 dark:bg-amber-450 shadow-[0_0_4px_rgba(245,158,11,0.4)]',
    high: 'bg-amber-450/75 dark:bg-amber-450/80',
    med: 'bg-amber-500/45 dark:bg-amber-500/50',
    low: 'bg-amber-500/20 dark:bg-amber-200/20',
    activeBorder: 'border-[0.5px] border-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400'
  },
  rose: {
    full: 'bg-rose-600 dark:bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.4)]',
    high: 'bg-rose-500/75 dark:bg-rose-500/80',
    med: 'bg-rose-500/45 dark:bg-rose-500/50',
    low: 'bg-rose-500/20 dark:bg-rose-200/20',
    activeBorder: 'border-[0.5px] border-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400'
  },
  purple: {
    full: 'bg-purple-600 dark:bg-purple-500 shadow-[0_0_4px_rgba(168,85,247,0.4)]',
    high: 'bg-purple-500/75 dark:bg-purple-500/80',
    med: 'bg-purple-500/45 dark:bg-purple-500/50',
    low: 'bg-purple-500/20 dark:bg-purple-200/20',
    activeBorder: 'border-[0.5px] border-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400'
  },
  blue: {
    full: 'bg-blue-600 dark:bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.4)]',
    high: 'bg-blue-500/75 dark:bg-blue-500/80',
    med: 'bg-blue-500/45 dark:bg-blue-500/50',
    low: 'bg-blue-500/20 dark:bg-blue-200/20',
    activeBorder: 'border-[0.5px] border-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400'
  }
};

const HeatMap: React.FC<HeatMapProps> = ({
  year,
  entries = [],
  customData,
  onDayClick,
  themeColor = 'indigo',
  maxMonth
}) => {
  const selectedYear = year || new Date().getFullYear();
  const colors = themeColors[themeColor] || themeColors.indigo;

  // Compile yearGrid dynamically (always returns full 53 weeks)
  const yearGrid = useMemo(() => {
    const contributionsMap: Record<string, { count: number; points: number }> = {};

    if (customData) {
      customData.forEach(item => {
        if (item.date) {
          contributionsMap[item.date] = {
            count: item.count !== undefined ? item.count : 1,
            points: item.points || 0
          };
        }
      });
    } else {
      entries.forEach(e => {
        if (e.toDate) {
          const entryDate = new Date(e.toDate);
          if (entryDate.getFullYear() === selectedYear) {
            if (!contributionsMap[e.toDate]) {
              contributionsMap[e.toDate] = { count: 0, points: 0 };
            }
            contributionsMap[e.toDate].count += 1;
            contributionsMap[e.toDate].points += e.points || 0;
          }
        }
      });
    }

    const grid = [];
    const firstJan = new Date(selectedYear, 0, 1);
    const dayOfWeek = firstJan.getDay();
    const startOfGrid = new Date(firstJan);
    startOfGrid.setDate(firstJan.getDate() - dayOfWeek);
    const runner = new Date(startOfGrid);

    for (let w = 0; w < 53; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = runner.toISOString().split('T')[0];
        const isCurrentYear = runner.getFullYear() === selectedYear;
        const dayInfo = contributionsMap[dateStr];
        weekDays.push({
          dateStr,
          isCurrentYear,
          count: dayInfo ? dayInfo.count : 0,
          points: dayInfo ? dayInfo.points : 0,
          dayOfWeek: d,
          dayOfMonth: runner.getDate(),
          month: runner.getMonth()
        });
        runner.setDate(runner.getDate() + 1);
      }
      grid.push(weekDays);
    }
    return grid;
  }, [entries, customData, selectedYear]);

  return (
    <div 
      onTouchStartCapture={(e) => e.stopPropagation()} 
      onTouchEndCapture={(e) => e.stopPropagation()}
      className="relative pt-1 w-full"
    >
      <div className="flex items-start gap-1">
        {/* Day of Week Labels */}
        <div className="flex flex-col justify-between h-[82px] pr-2 text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none shrink-0 select-none mt-[20px]">
          <span className="h-[10px] flex items-center justify-end">Sun</span>
          <span className="h-[10px] flex items-center justify-end">Mon</span>
          <span className="h-[10px] flex items-center justify-end">Tue</span>
          <span className="h-[10px] flex items-center justify-end">Wed</span>
          <span className="h-[10px] flex items-center justify-end">Thu</span>
          <span className="h-[10px] flex items-center justify-end">Fri</span>
          <span className="h-[10px] flex items-center justify-end">Sat</span>
        </div>

        {/* Outer scrolling container */}
        <div className="flex-1 overflow-x-auto pb-1.5 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-gray-350 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-transparent no-scrollbar">
          <div className="min-w-[420px] space-y-1 select-none">
            
            {/* Month Labels row - Always visible across all 53 columns */}
            <div className="flex gap-[2px] h-4">
              {yearGrid.map((week, wIdx) => {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const firstDayInYear = week.find(d => d.isCurrentYear) || week[0];
                const m = firstDayInYear.month;
                const prevWeek = yearGrid[wIdx - 1];
                const prevMonth = prevWeek ? (prevWeek.find(d => d.isCurrentYear)?.month ?? -1) : -1;
                const isFirstWeekOfThisMonth = wIdx === 0 || (prevMonth !== m);

                return (
                  <div key={wIdx} className="w-[10px] relative shrink-0">
                    {isFirstWeekOfThisMonth && (
                      <span className={`absolute left-0 text-[8px] font-black ${colors.text} uppercase tracking-wider whitespace-nowrap`}>
                        {monthNames[m]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Heatmap Matrix Row */}
            <div className="flex gap-[2px] h-[82px]">
              {yearGrid.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-[2px] justify-between h-full">
                  {week.map((day, dIdx) => {
                    const isFutureMonth = maxMonth !== undefined && day.month > maxMonth;
                    const isClickable = day.isCurrentYear && !isFutureMonth;

                    let shadeClass = "bg-gray-200/60 dark:bg-slate-800/80"; // Default clean 0-log space
                    let activeBorder = "border-[0.5px] border-gray-150/40 dark:border-slate-800/40";
                    
                    // Only process score color steps if it isn't restricted by maxMonth constraint
                    if (day.isCurrentYear && !isFutureMonth && day.count > 0) {
                      if (day.points >= 100) {
                        shadeClass = colors.full;
                      } else if (day.points >= 60) {
                        shadeClass = colors.high;
                      } else if (day.points >= 30) {
                        shadeClass = colors.med;
                      } else {
                        shadeClass = colors.low;
                      }
                      activeBorder = colors.activeBorder;
                    } else if (!day.isCurrentYear) {
                      // Hides structural layout blocks belonging to previous or trailing year overlaps
                      shadeClass = "bg-transparent opacity-0 pointer-events-none";
                      activeBorder = "border-transparent";
                    }

                    const formattedTip = isClickable
                      ? `${new Date(day.dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${day.count} log${day.count !== 1 ? 's' : ''} (${day.points} pts)`
                      : "";

                    return (
                      <div
                        key={dIdx}
                        onClick={() => {
                          if (isClickable && onDayClick) {
                            onDayClick(day.dateStr, day.points, day.count);
                          }
                        }}
                        className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-200 relative ${shadeClass} ${activeBorder} group/day ${
                          isClickable ? 'cursor-pointer hover:scale-110 shadow-sm' : ''
                        }`}
                        title={formattedTip}
                      >
                        {isClickable && (
                          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-750 text-white text-[9px] px-2 py-1 rounded shadow-xl whitespace-nowrap opacity-0 group-hover/day:opacity-100 pointer-events-none transition-all duration-150 z-25 font-bold">
                            {formattedTip}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;