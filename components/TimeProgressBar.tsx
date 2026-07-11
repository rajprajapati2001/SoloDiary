import React from 'react';

interface TimeProgressBarProps {
  startTime: string; // Format: "HH:MM"
  endTime?: string;  // Format: "HH:MM" (optional for single-point events)
  isGoal?: boolean;  // For styling (green for goals, blue for others)
}

const TimeProgressBar: React.FC<TimeProgressBarProps> = ({
  startTime,
  endTime,
  isGoal = false,
}) => {
  // Convert "HH:MM" to minutes since midnight
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const startMinutes = timeToMinutes(startTime);
  let endMinutes = endTime ? timeToMinutes(endTime) : startMinutes;
  const totalDayMinutes = 24 * 60;

  // FIX: If endTime is on the next day (smaller than startTime), 
  // or if it spans across midnight, cap it at the end of the current day.
  if (endTime && endMinutes < startMinutes) {
    endMinutes = totalDayMinutes;
  }

  // Calculate positions
  const leftPercent = (startMinutes / totalDayMinutes) * 100;
  const widthPercent = endTime
    ? ((endMinutes - startMinutes) / totalDayMinutes) * 100
    : 1.5; // Default width for single-point events

  return (
    <div className="mt-2 border-t border-gray-200/50 dark:border-slate-800/60">
      {/* Timeline markers */}
      <div className="relative w-full h-2 rounded-full bg-gray-200/60 dark:bg-slate-800/80 shadow-inner overflow-hidden">
        <div className="absolute left-1/4 top-0 bottom-0 w-[1px] bg-gray-300 dark:bg-slate-700/40" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-300 dark:bg-slate-700/40" />
        <div className="absolute left-3/4 top-0 bottom-0 w-[1px] bg-gray-300 dark:bg-slate-700/40" />

        {/* Progress bar */}
        <div
          className={`absolute h-full top-0 rounded-full transition-all duration-300 ${
            isGoal
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]'
          }`}
          style={{
            left: `${leftPercent}%`,
            width: `${Math.max(widthPercent, 1)}%`, // Ensure minimum width
          }}
        />
      </div>
    </div>
  );
};

export default TimeProgressBar;