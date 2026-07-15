import React, { useMemo } from 'react';
import { ActivityEntry } from '../types';
import { Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TodayProgressBarProps {
  entries: ActivityEntry[];
  selectedDate: string;
  onActivityClick?: (entryId: string) => void;
  variant?: 'default' | 'stats';
}

// Helper to convert HH:MM string to total minutes
const parseTimeToMinutes = (timeStr: string | null): number => {
  if (!timeStr) return 0;
  
  const clean = timeStr.trim().toUpperCase();
  
  // Try 12-hour AM/PM format matching
  const match12 = clean.match(/^(\d+):(\d+)\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10) || 0;
    const minutes = parseInt(match12[2], 10) || 0;
    const isPm = match12[3] === 'PM';
    if (hours === 12) {
      hours = isPm ? 12 : 0;
    } else if (isPm) {
      hours += 12;
    }
    return hours * 60 + minutes;
  }
  
  // Try 24-hour HH:MM format
  const parts = clean.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
  
  return 0;
};

// Map code to beautiful, vibrant, deterministic custom colors
const getActivityColor = (code: string): string => {
  const predefined: Record<string, string> = {
    // ID 1: Sleep (Calming Deep Blue - dominates night hours)
    'S': '#1e40af',    
    'BF': '#f472b6',   
    'M': '#65a30d',    
    'L': '#06b6d4',    
    'D': '#ea580c',    
    'R': '#10b981',    
    'W': '#cb9801',    
    'E': '#8b5cf6',    
    'Y': '#6366f1',    
    'SP': '#bd0d5c',   
    'Cr': '#22c55e',   
    'Db': '#ef4444',   

    // --- Legacy / Extra Codes (Mapped to stay visually distinct) ---
    'F': '#2dd4bf',    // Mint
    'T': '#a855f7',    // Purple-light
    'MH': '#f97316',   // Orange
    'J': '#fbbf24',    // Dark Indigo
    'ST': '#dc2626',   // Intense Red
    'FT': '#f43f5e',   // Rose
    'SMKV': '#fbbf24', // Amber
    'GP': '#ec4899',   // Pink
  };


  
  const upper = code.toUpperCase();
  if (predefined[upper]) return predefined[upper];
  if (predefined[code]) return predefined[code];

  // Consistent hashing for custom codes to return vibrant, beautiful, random custom colors
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 85%, 55%)`;
};

// Formats minutes into human-readable HH:MM AM/PM
const formatMinutesToTime = (totalMin: number): string => {
  const hours = Math.floor(totalMin / 60) % 24;
  const minutes = totalMin % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

// Formats duration based on minutes and long-event criteria
const formatDuration = (mins: number, isLongEvent: boolean): string => {
  if (!isLongEvent || mins <= 0) {
    return '0 mint';
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMins} mint`;
  }
  return `${remainingMins} mint`;
};

export const TodayProgressBar: React.FC<TodayProgressBarProps> = ({
  entries,
  selectedDate,
  onActivityClick,
  variant = 'default',
}) => {
  // Filter and compute positioning for today's entries
  const timelineBlocks = useMemo(() => {
    const dayEntries = entries.filter(e => (e.fromDate || e.toDate) === selectedDate);
    
    return dayEntries.map(entry => {
      const startMin = parseTimeToMinutes(entry.fromTime || entry.toTime);
      let endMin = entry.isLongEvent && entry.toTime
        ? parseTimeToMinutes(entry.toTime)
        : startMin; // single time entry matches start time

      if (endMin < startMin) {
        endMin = 1440; // cap at midnight if crossed
      }
      
      const duration = entry.isLongEvent && entry.toTime ? (endMin - startMin) : 0;
      const leftPercent = (startMin / 1440) * 100;
      // 1.5% min width for visually clear vertical bar lines for point events
      const widthPercent = entry.isLongEvent && entry.toTime 
        ? Math.max(((endMin - startMin) / 1440) * 100, 1.2) 
        : 1.5; 
      
      const color = getActivityColor(entry.code);
      
      return {
        entry,
        startMin,
        endMin,
        duration,
        leftPercent,
        widthPercent,
        color,
      };
    }).sort((a, b) => a.startMin - b.startMin);
  }, [entries, selectedDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 24-Hour Timeline Bar */}
      <div className="relative">
        <div 
          className={`relative w-full h-16 bg-slate-100 rounded-xl overflow-visible border border-gray-200/50 shadow-inner flex items-center ${
            variant !== 'stats' ? 'dark:bg-slate-900 dark:border-slate-700/60' : ''
          }`}
          style={{ contentVisibility: 'auto' }}
        >
          {timelineBlocks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 dark:text-slate-500 font-medium italic">
              No entries logged for this day
            </div>
          ) : (
            timelineBlocks.map(({ entry, leftPercent, widthPercent, color, duration, startMin, endMin }, idx) => {
              const codeLetters = entry.code.split('');
              const showText = widthPercent >= 1.0;
              
              // Round left edge if at start of day, right edge if at end of day
              const isAtLeftEdge = leftPercent < 1.5;
              const isAtRightEdge = (leftPercent + widthPercent) > 98.5;
              const roundedClass = `${isAtLeftEdge ? 'rounded-l-xl' : ''} ${isAtRightEdge ? 'rounded-r-xl' : ''}`;

              return (
                <motion.button
                  key={entry.id || idx}
                  whileHover={{ scaleY: 1.05, brightness: 1.15 }}
                  onClick={() => onActivityClick?.(entry.id)}
                  data-activity-id={entry.id}
                  className={`absolute top-0 bottom-0 flex flex-col items-center justify-center text-white cursor-pointer select-none transition-all duration-200 border-r border-black/10 break-all leading-none overflow-visible group focus:outline-none ${roundedClass}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                    zIndex: entry.isLongEvent ? 10 : 20,
                  }}
                >
                  {/* Vertical Code Stacking */}
                  {showText && (
                    <div className="flex flex-col items-center justify-center leading-[1.1] text-[7px] uppercase text-white h-full pointer-events-none select-none filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
                      {codeLetters.map((char, cIdx) => (
                        <span key={cIdx}>{char}</span>
                      ))}
                    </div>
                  )}

                  {/* Pure CSS Hover Tooltip overlay (works beautifully in exported static HTML!) */}
                  <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 opacity-0 pointer-events-none transition-all duration-200 bg-slate-950/95 text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700/80 flex flex-col gap-1 text-xs font-sans z-[999] whitespace-nowrap scale-90 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100 origin-bottom"
                    style={{ minWidth: '200px' }}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <span 
                        className="px-1.5 py-0.5 rounded text-[10px] text-white font-mono font-black shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {entry.code}
                      </span>
                      <span className="text-gray-100 text-[13px] font-bold">{entry.name}</span>
                      <span className="text-emerald-400 font-bold ml-auto pl-2 text-[11px]">
                        [{entry.points || 0} point]
                      </span>
                    </div>
                    
                    <div className="text-[11px] text-slate-300 font-mono font-semibold text-left">
                      {formatMinutesToTime(startMin)} - {entry.isLongEvent && entry.toTime ? formatMinutesToTime(endMin) : formatMinutesToTime(startMin)} ({formatDuration(duration, entry.isLongEvent)})
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>

        {/* Time Indicators */}
        <div className="flex justify-between mt-2.5 px-1 text-[10px] font-mono font-medium text-gray-400 dark:text-slate-500">
          <span>12 AM</span>
          <span className="hidden sm:inline">3 AM</span>
          <span>6 AM</span>
          <span className="hidden sm:inline">9 AM</span>
          <span>12 PM</span>
          <span className="hidden sm:inline">3 PM</span>
          <span>6 PM</span>
          <span className="hidden sm:inline">9 PM</span>
          <span>12 AM</span>
        </div>
      </div>
    </motion.div>
  );
};
