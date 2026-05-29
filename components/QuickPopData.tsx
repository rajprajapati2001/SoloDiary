import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ActivityEntry, Goal } from '../types';

import {
  X,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Banknote,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { motion, AnimatePresence } from 'motion/react';

interface QuickPopDataProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'daily' | 'monthly_pts' | 'yearly_pts' | 'yearly_goals' | 'financial';
  entries: ActivityEntry[];
  goals: Goal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  scrollToActivities: () => void;
  scrollToActivity: (entryId: string, date?: string) => void;
}

const QuickPopData: React.FC<QuickPopDataProps> = ({
  isOpen,
  onClose,
  type,
  entries,
  goals,
  selectedDate,
  onSelectDate,
  scrollToActivities,
  scrollToActivity
}) => {

  const dateObj = useMemo(() => new Date(selectedDate), [selectedDate]);

  const currentYear = dateObj.getFullYear();

  const [activeDate, setActiveDate] = useState(selectedDate);
  const [activeYear, setActiveYear] = useState(currentYear);

  useEffect(() => {
    setActiveDate(selectedDate);
    setActiveYear(currentYear);
  }, [selectedDate, currentYear]);

  const activeMonth = activeDate.substring(0, 7);

  const activeDayEntries = entries.filter(
    e => e.toDate === activeDate
  );

  const activeMonthEntries = entries.filter(
    e => e.toDate.startsWith(activeMonth)
  );

  const activeYearEntries = entries.filter(
    e => new Date(e.toDate).getFullYear() === activeYear
  );

  const financialSummary = useMemo(() => {
    let credit = 0;
    let debit = 0;

    activeMonthEntries.forEach(e => {
      if (e.credit) credit += e.credit;
      if (e.debit) debit += e.debit;
    });

    return {
      credit,
      debit,
      balance: credit - debit
    };
  }, [activeMonthEntries]);

  const metadata = {
    daily: {
      title: 'Daily Target',
      icon: <Target className="text-emerald-500" size={24} />,
      headerBg: 'bg-emerald-500/10 border-emerald-500/20'
    },

    monthly_pts: {
      title: 'Months Target',
      icon: <Calendar className="text-blue-500" size={24} />,
      headerBg: 'bg-blue-500/10 border-blue-500/20'
    },

    yearly_pts: {
      title: 'Yearly Points',
      icon: <TrendingUp className="text-indigo-500" size={24} />,
      headerBg: 'bg-indigo-500/10 border-indigo-500/20'
    },

    yearly_goals: {
      title: 'Yearly Goals',
      icon: <Award className="text-purple-500" size={24} />,
      headerBg: 'bg-purple-500/10 border-purple-500/20'
    },

    financial: {
      title: 'Transaction',
      icon: <Banknote className="text-teal-500" size={24} />,
      headerBg: 'bg-teal-500/10 border-teal-500/20'
    }
  }[type];

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>

      <div className="fixed inset-0 z-[150] flex items-center justify-center md:p-4 p-2">

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800 border border-gray-100 dark:border-slate-700 z-10"
        >

          <div className={`flex items-center justify-between border-b p-4 ${metadata.headerBg}`}>
            <div className="flex items-center gap-3">
              {metadata.icon}

              <h3 className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white">
                {metadata.title}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="md:p-5 p-3 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-4">

            {/* DAILY */}
{type === 'daily' && (
  <div className="space-y-4">
    {/* Navigation Header */}
    <div className="flex items-center justify-between">
      <button
        onClick={() => {
          const d = new Date(activeDate);
          d.setDate(d.getDate() - 1);
          setActiveDate(d.toISOString().split('T')[0]);
        }}
        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="text-center">
        <p className="text-xs uppercase text-gray-400">Selected Day</p>
        <h3 className="font-black text-lg text-gray-800 dark:text-white">
          {new Date(activeDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </h3>
      </div>

      <button
        onClick={() => {
          const d = new Date(activeDate);
          d.setDate(d.getDate() + 1);
          setActiveDate(d.toISOString().split('T')[0]);
        }}
        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
      >
        <ChevronRight size={16} />
      </button>
    </div>

    {/* Daily Total Score Card */}
    <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-center">
      <p className="text-xs uppercase tracking-widest text-gray-400">Daily Total Score</p>
      <p className="text-5xl font-black text-emerald-500 font-digital mt-2">
        {activeDayEntries.reduce((s, e) => s + e.points, 0)}
      </p>
    </div>

    {/* Sorted List of Entries */}
    <div className="md:space-y-2 space-y-1">
      {activeDayEntries
        .slice() // Copy array to avoid mutating state
        .sort((a, b) => {
          // Sort logic: Use fromTime if it exists, otherwise use toTime
          const timeA = a.fromTime || a.toTime;
          const timeB = b.fromTime || b.toTime;
          return timeA.localeCompare(timeB);
        })
        .map(item => (
          <button
            key={item.id}
            onClick={() => {
              onSelectDate(item.toDate);
              onClose();
              setTimeout(() => {
                scrollToActivity(item.id, item.toDate);
              }, 400);
            }}
          className={`w-full text-left p-3 rounded-2xl transition-all border ${
            goals.some(g => g.code === item.code && g.achievedAt === item.toDate)
              ? 'border-emerald-500/40 shadow-md shadow-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' 
              : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900'
          } hover:border-emerald-500/60`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-gray-800 dark:text-white">
                  {item.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {item.isLongEvent ? `${item.fromTime} – ${item.toTime}` : item.toTime}
                </p>
              </div>

              <div className="text-right">
                <p className="text-emerald-500 font-black">
                  +{item.points}
                </p>
              </div>
            </div>
          </button>
        ))}
    </div>
  </div>
)}

            {/* MONTH */}

            {type === 'monthly_pts' && (
              <div className="space-y-4">

                <div className="flex items-center justify-between">

                  <button
                    onClick={() => setActiveYear(prev => prev - 1)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <h3 className="text-xl font-black text-gray-800 dark:text-white">
                    {activeYear}
                  </h3>

                  <button
                    onClick={() => setActiveYear(prev => prev + 1)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Total Months <span className="md:hidden">Pts</span><span className="hidden md:inline">Points</span>
                    </p>

                    <p className="text-3xl font-black text-blue-600 font-digital mt-1">
                      {activeYearEntries.reduce((s, e) => s + e.points, 0)}
                    </p>
                  </div>

                  <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/10 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      Month Progress %
                    </p>

                    <p className="text-3xl font-black text-purple-600 font-digital mt-1">
                      {Math.min(
                        (
                          activeYearEntries.reduce((s, e) => s + e.points, 0) /
                          (365 * 100)
                        ) * 100,
                        100
                      ).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="md:space-y-2 space-y-1">
                  {[...Array(12)].map((_, i) => {
                    const monthDate = `${activeYear}-${String(i + 1).padStart(2, '0')}`;

                    const data = entries.filter(e =>
                      e.toDate.startsWith(monthDate)
                    );

                    const score = data.reduce((s, e) => s + e.points, 0);

                    const progress = Math.min(
                      (score / (30 * 100)) * 100,
                      100
                    );

                    return (
                      <button
                        key={monthDate}
                        onClick={() => {
                          const firstDate = `${monthDate}-01`;

                          onSelectDate(firstDate);

                          onClose();

                          setTimeout(() => {
                            scrollToActivities();
                          }, 300);
                        }}
                        disabled={score === 0}
className={`w-full p-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 ${
  score === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/30'
} transition-all`}>
                        <div className="flex items-center justify-between">

                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500">
                                {activeYear.toString().slice(-2)}
                            </div>

                            <div className="text-left">
                              <p className="font-black text-gray-800 dark:text-white">
                              {new Date(`${monthDate}-01`).toLocaleString('default', {
                                month: 'long',
                              })}
                              </p>

                              <p className="text-xs text-gray-400">
                                Month Analytics
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-black text-blue-500">
                              {score}
                            </p>

                            <p className="text-xs text-gray-400">
                              {progress.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* YEARLY POINTS */}

{type === 'yearly_pts' && (
  <div className="md:space-y-3 space-y-1">
    {[...new Set(entries.map(e => new Date(e.toDate).getFullYear()))]
      .sort((a, b) => b - a)
      .map(year => {
        const score = entries
          .filter(e => new Date(e.toDate).getFullYear() === year)
          .reduce((s, e) => s + e.points, 0);

        return (
          <button
            key={year}
            onClick={() => {
              // Construct string date format: YYYY-01-01 (1st January)
              const targetDate = `${year}-01-01`;
              
              // Route to the selected date
              onSelectDate(targetDate);
              
              // Close modal overlay/drawer
              onClose();
            }}
            className="w-full text-left p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer block"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-400">
                  Year
                </p>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white">
                  {year}
                </h3>
              </div>

              <div className="text-right">
                <p className="text-3xl font-black text-indigo-500 font-digital">
                  {score}
                </p>
                <p className="text-xs text-gray-400">
                  Total Points
                </p>
              </div>
            </div>
          </button>
        );
      })}
  </div>
)}

            {/* YEARLY GOALS */}

{type === 'yearly_goals' && (
  <div className="space-y-4">
    {/* YEAR NAVIGATION */}
    <div className="flex items-center justify-between">
      <button
        onClick={() => setActiveYear(prev => prev - 1)}
        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="text-center">
        <p className="text-xs uppercase text-gray-400">Goals of</p>
        <h3 className="text-lg font-black text-gray-800 dark:text-white">
          {activeYear}
        </h3>
      </div>

      <button
        onClick={() => setActiveYear(prev => prev + 1)}
        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
      >
        <ChevronRight size={16} />
      </button>
    </div>

    {/* TOTAL YEARLY GOALS SUMMARY BOX */}
    <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-2xl text-center">
      <p className="text-xs uppercase tracking-widest text-gray-400">Yearly Goals Achieved</p>
      <p className="text-5xl font-black text-purple-500 font-digital mt-2">
        {
          goals.filter(
            g => g.achievedAt && new Date(g.achievedAt).getFullYear() === activeYear
          ).length
        }
      </p>
    </div>

    {/* YEAR ITEMS LISTING */}
    <div className="md:space-y-2 space-y-1">
      {goals
        .filter(
          g => g.achievedAt && new Date(g.achievedAt).getFullYear() === activeYear
        )
        .slice() // Copy to avoid mutation
        .sort((a, b) => {
          // 1. Sort by Date Ascending
          const dateA = new Date(a.achievedAt!).getTime();
          const dateB = new Date(b.achievedAt!).getTime();
          if (dateA !== dateB) return dateA - dateB;

          // 2. Sort by Time Ascending (if dates are identical)
          const timeA = entries.find(e => e.toDate === a.achievedAt && e.code === a.code)?.fromTime || "";
          const timeB = entries.find(e => e.toDate === b.achievedAt && e.code === b.code)?.fromTime || "";
          return timeA.localeCompare(timeB);
        })
        .map(g => (
          <button
            key={g.id}
            onClick={() => {
              if (!g.achievedAt) return;
              onSelectDate(g.achievedAt);
              onClose();
              setTimeout(() => {
                const found = entries.find(
                  e => e.toDate === g.achievedAt && e.code === g.code
                );
                if (found) {
                  scrollToActivity(found.id, found.toDate);
                }
              }, 400);
            }}
            className="w-full p-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-purple-500/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Star
                    size={16}
                    className="text-purple-500"
                    fill="currentColor"
                  />
                </div>

                <div>
                  <p className="font-black text-gray-800 dark:text-white leading-tight">
                    {g.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(g.achievedAt!).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-emerald-500">
                  +{g.points}
                </p>
                <p className="text-[10px] text-gray-400 uppercase">
                  Goal
                </p>
              </div>
            </div>
          </button>
        ))}

      {goals.filter(
        g => g.achievedAt && new Date(g.achievedAt).getFullYear() === activeYear
      ).length === 0 && (
        <div className="text-center py-10 text-sm text-gray-400">
          No Goals Found in {activeYear}
        </div>
      )}
    </div>
  </div>
)}


            {/* TRANSACTION */}
{type === 'financial' && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <button
        onClick={() => {
          const d = new Date(activeDate);
          d.setMonth(d.getMonth() - 1);
          setActiveDate(d.toISOString().split('T')[0]);
        }}
        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
      >
        <ChevronLeft size={16} />
      </button>

      <h3 className="text-lg font-black text-gray-800 dark:text-white">
        {new Date(activeDate).toLocaleString('default', {
          month: 'long',
          year: 'numeric'
        })}
      </h3>

      <button
        onClick={() => {
          const d = new Date(activeDate);
          d.setMonth(d.getMonth() + 1);
          setActiveDate(d.toISOString().split('T')[0]);
        }}
        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
      >
        <ChevronRight size={16} />
      </button>
    </div>

    <div className="grid grid-cols-3 gap-2">

      <div className="p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 text-center">
        <p className="text-[10px] uppercase text-gray-400">Credit</p>
        <p className="text-lg font-black mt-1 text-emerald-500">
          +{financialSummary.credit}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 text-center">
        <p className="text-[10px] uppercase text-gray-400">Debit</p>
        <p className="text-lg font-black mt-1 text-red-500">
          -{financialSummary.debit}
        </p>
      </div>
      
      <div className={`p-3 rounded-xl ${
  financialSummary.balance >= 0
    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20'
    : 'bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20'
}  text-center`}>
        <p className="text-[10px] uppercase text-gray-400">Balance</p>
        <p className={`text-lg font-black mt-1 ${
          financialSummary.balance >= 0 ? 'text-emerald-500' : 'text-red-500'
        }`}>
          {financialSummary.balance}
        </p>
      </div>
    </div>

    <div className="md:space-y-2 space-y-1">
  {activeMonthEntries
    .filter(e => e.credit || e.debit)
    .slice()
    .sort((a, b) => {
      // 1. Sort by Date first
      const dateCompare = a.toDate.localeCompare(b.toDate);
      if (dateCompare !== 0) return dateCompare;

      // 2. If dates are the same, sort by Time (fromTime or toTime)
      const timeA = a.fromTime || a.toTime || "";
      const timeB = b.fromTime || b.toTime || "";
      return timeA.localeCompare(timeB);
    })
    .map(item => {
      const isGoalAchieved = goals.some(g => g.code === item.code && g.achievedAt === item.toDate);
      
      return (
        <button
          key={item.id}
          onClick={() => {
            onSelectDate(item.toDate);
            onClose();
            setTimeout(() => {
              scrollToActivity(item.id, item.toDate);
            }, 350);
          }}
          className={`w-full p-3 rounded-2xl border transition-all ${
            isGoalAchieved
              ? 'border-emerald-500/40 shadow-md shadow-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' 
              : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900'
          } hover:border-emerald-500/40`}
        >
          <div className="flex items-center justify-between">
            {/* LEFT SIDE: Name and Time */}
            <div className="text-left">
              <p className="font-black text-gray-800 dark:text-white leading-tight">
                {item.name}
              </p>
              <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-tight mt-0.5">
                {item.isLongEvent ? `${item.fromTime} – ${item.toTime}` : item.toTime}
              </p>
            </div>

            {/* RIGHT SIDE: Date and Amount */}
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">
                {new Date(item.toDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
              </p>
              
              {item.credit > 0 && (
                <p className="font-black text-emerald-500 leading-none">
                  +{item.credit} ₹
                </p>
              )}
              {item.debit > 0 && (
                <p className="font-black text-red-500 leading-none">
                  -{item.debit} ₹
                </p>
              )}
            </div>
          </div>
        </button>
      );
    })}
</div>
  </div>
)}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default QuickPopData;