import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ActivityEntry, Goal } from '../types';
import { getCurrencySymbol, getAggregateCurrencyDisplay } from '../constants';

import {
  X,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Banknote,
  Star,
  ChevronLeft,
  ChevronRight,
  Check, 
  Edit2,
  Trophy,
  Activity,
  Coins,
  ListTodo
} from 'lucide-react';

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import HeatMap from './HeatMap';

interface QuickPopDataProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'daily' | 'monthly_pts' | 'yearly_pts' | 'yearly_goals' | 'financial' | 'profile';
  entries: ActivityEntry[];
  goals: Goal[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  scrollToActivities: () => void;
  scrollToActivity: (entryId: string, date?: string) => void;
  userName?: string;
  currentTimeClass?: string;
  onUpdateUserName?: (newName: string) => void;
}

const formatGoalDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()].toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const QuickPopData: React.FC<QuickPopDataProps> = ({
  isOpen,
  onClose,
  type,
  entries,
  goals,
  selectedDate,
  onSelectDate,
  scrollToActivities,
  scrollToActivity,
  userName = 'User',
  currentTimeClass = '',
  onUpdateUserName
}) => {
  // Animation states
  const shouldReduceMotion = useReducedMotion();
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isHeavyUiReady, setIsHeavyUiReady] = useState(false);

  // State for name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(userName || "");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync with external userName updates
  useEffect(() => {
    setEditNameValue(userName);
  }, [userName]);

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditNameValue(userName);
      setIsEditingName(false);
    }
  };

  // Save handler
  const handleSaveName = () => {
    if (editNameValue.trim() && editNameValue.trim() !== userName) {
      if (onUpdateUserName) {
        onUpdateUserName(editNameValue.trim());
      }
    }
    setIsEditingName(false);
  };

  const dateObj = useMemo(() => new Date(selectedDate), [selectedDate]);
  const currentYear = isNaN(dateObj.getFullYear()) ? 2026 : dateObj.getFullYear();

  const [activeDate, setActiveDate] = useState(selectedDate);
  const [activeYear, setActiveYear] = useState(currentYear);
  // Dedicated profile view tracking year navigation state
  const [profileYear, setProfileYear] = useState(currentYear);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setIsVisible(false);
      setIsHeavyUiReady(false);
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
      const timer = window.setTimeout(() => {
        setIsHeavyUiReady(true);
      }, 220); // Delay heavy UI rendering until the opening animation finishes
      return () => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timer);
      };
    } else {
      setIsClosing(true);
      setIsVisible(false);
      setIsHeavyUiReady(false);
      const closeTimer = window.setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 180);
      return () => {
        window.clearTimeout(closeTimer);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (shouldRender) {
      setActiveDate(selectedDate);
      setActiveYear(currentYear);
      setProfileYear(currentYear);
    }
  }, [selectedDate, currentYear, shouldRender]);

  const activeMonth = activeDate.substring(0, 7);

  const activeDayEntries = useMemo(() => {
    if (!shouldRender) return [];
    return entries.filter(
      e => (e.fromDate || e.toDate) === activeDate
    );
  }, [entries, activeDate, shouldRender]);

  const activeMonthEntries = useMemo(() => {
    if (!shouldRender) return [];
    return entries.filter(
      e => (e.fromDate || e.toDate).startsWith(activeMonth)
    );
  }, [entries, activeMonth, shouldRender]);

  const activeYearEntries = useMemo(() => {
    if (!shouldRender) return [];
    return entries.filter(
      e => {
        try {
          return new Date(e.fromDate || e.toDate).getFullYear() === activeYear;
        } catch {
          return false;
        }
      }
    );
  }, [entries, activeYear, shouldRender]);

  const financialSummary = useMemo(() => {
    let credit = 0;
    let debit = 0;

    if (!shouldRender) {
      return {
        credit,
        debit,
        balance: 0
      };
    }

    activeMonthEntries.forEach(e => {
      if (e.credit) credit += e.credit;
      if (e.debit) debit += e.debit;
    });

    return {
      credit,
      debit,
      balance: credit - debit
    };
  }, [activeMonthEntries, shouldRender]);
  
  // Profile Stats Calculation
  const profileStats = useMemo(() => {
    if (!shouldRender || (type === 'profile' && !isHeavyUiReady)) {
      return {
        entriesYear: [],
        totalPointsYear: 0,
        totalActivitiesYear: 0,
        completedGoalsYear: [],
        totalGoalsInYear: [],
        avgPointsPerDayYear: 0,
        currentStreak: 0,
        rank: "Novice Logger",
        totalDebitYear: 0,
        totalCreditYear: 0,
        netBalanceYear: 0,
        trackingYear: profileYear,
        activeDaysCountYear: 0,
        annualGradeYear: "D",
        annualGradeDescription: "Aspirant",
        yearGrid: []
      };
    }

    const entriesYear = entries.filter(e => {
      try {
        return new Date(e.fromDate || e.toDate).getFullYear() === profileYear;
      } catch {
        return false;
      }
    });

    const totalPointsYear = entriesYear.reduce((sum, e) => sum + (e.points || 0), 0);
    const totalActivitiesYear = entriesYear.length;
    
    const completedGoalsYear = goals.filter(g => g.achievedAt && new Date(g.achievedAt).getFullYear() === profileYear);
    const totalGoalsInYear = goals.filter(g => 
      (g.achievedAt && new Date(g.achievedAt).getFullYear() === profileYear) || 
      (!g.achievedAt && parseInt(g.deadlineYear) === profileYear)
    );

    const entriesByDateInYear: Record<string, { count: number; points: number }> = {};
    entriesYear.forEach(e => {
      const eDate = e.fromDate || e.toDate;
      if (!entriesByDateInYear[eDate]) {
        entriesByDateInYear[eDate] = { count: 0, points: 0 };
      }
      entriesByDateInYear[eDate].count += 1;
      entriesByDateInYear[eDate].points += (e.points || 0);
    });

    const activeDaysCountYear = Object.keys(entriesByDateInYear).length;
    const totalActiveDaysCount = Math.max(activeDaysCountYear, 1);
    const avgPointsPerDayYear = Math.round(totalPointsYear / totalActiveDaysCount);

    // Streaks calculations
    const sortedDates = (Array.from(new Set(entries.map(e => e.fromDate || e.toDate))) as string[])
      .sort((a, b) => b.localeCompare(a));

    let currentStreak = 0;
    if (sortedDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
        currentStreak = 1;
        let checkDate = new Date(sortedDates[0]);
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i]);
          const diffTime = Math.abs(checkDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentStreak++;
            checkDate = prevDate;
          } else if (diffDays > 1) {
            break;
          }
        }
      }
    }

    // Rank evaluation based on selected profile tracking year
    let rank = "Novice Logger";
    if (totalPointsYear >= 100 && totalPointsYear < 500) rank = "Aspirant Scholar";
    else if (totalPointsYear >= 500 && totalPointsYear < 1500) rank = "Elite Chronicler";
    else if (totalPointsYear >= 1500 && totalPointsYear < 4000) rank = "Master Navigator";
    else if (totalPointsYear >= 4000) rank = "Legendary Voyager";

    // Financial calculations scaled to the selected navigation year
    const totalDebitYear = entriesYear.reduce((s, e) => s + (e.debit || 0), 0);
    const totalCreditYear = entriesYear.reduce((s, e) => s + (e.credit || 0), 0);
    const netBalanceYear = totalCreditYear - totalDebitYear;
    
    let annualGradeYear = "D";
    let annualGradeDescription = "Aspirant";
    if (activeDaysCountYear >= 150) {
      annualGradeYear = "S";
      annualGradeDescription = "Legendary Chronicler";
    } else if (activeDaysCountYear >= 80) {
      annualGradeYear = "A";
      annualGradeDescription = "Elite Companion";
    } else if (activeDaysCountYear >= 40) {
      annualGradeYear = "B";
      annualGradeDescription = "Dedicated Logger";
    } else if (activeDaysCountYear >= 15) {
      annualGradeYear = "C";
      annualGradeDescription = "Regular Explorer";
    }

    const yearGrid = [];
    const firstJan = new Date(profileYear, 0, 1);
    const dayOfWeek = firstJan.getDay();
    const startOfGrid = new Date(firstJan);
    startOfGrid.setDate(firstJan.getDate() - dayOfWeek);
    const runner = new Date(startOfGrid);

    for (let w = 0; w < 53; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = runner.toISOString().split('T')[0];
        const isCurrentYear = runner.getFullYear() === profileYear;
        const dayInfo = entriesByDateInYear[dateStr];
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
      yearGrid.push(weekDays);
    }

    return {
      entriesYear,
      totalPointsYear,
      totalActivitiesYear,
      completedGoalsYear,
      totalGoalsInYear,
      avgPointsPerDayYear,
      currentStreak,
      rank,
      totalDebitYear,
      totalCreditYear,
      netBalanceYear,
      trackingYear: profileYear,
      activeDaysCountYear,
      annualGradeYear,
      annualGradeDescription,
      yearGrid
    };
  }, [entries, goals, profileYear, shouldRender, isHeavyUiReady, type]);

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
    },
    profile: {
      title: 'Performance Report',
      icon: <Award className="text-inherit" size={24} />,
      headerBg: currentTimeClass ? `${currentTimeClass} border-transparent text-inherit` : 'bg-slate-500/10 border-slate-500/20 text-gray-800 dark:text-white'
    }
  }[type];

  const handleCloseWithAnimation = () => {
    if (isClosing) return;
    onClose();
  };

  if (!shouldRender) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseWithAnimation}
            className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-[1px] cursor-pointer"
          />

          <motion.div
            key="modal"
            initial={shouldReduceMotion ? { opacity: 0, y: 15 } : {
              opacity: 0,
              scale: 0.95,
              y: 20,
              rotateX: -5,
              transformPerspective: 1000
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              rotateX: 0,
              transition: {
                type: "spring",
                stiffness: 280,
                damping: 26,
              }
            }}
            exit={shouldReduceMotion ? { opacity: 0, y: 15 } : {
              opacity: 0,
              scale: 0.95,
              y: 20,
              rotateX: 5,
              transition: { duration: 0.18, ease: "easeOut" }
            }}
            className="fixed inset-0 z-[151] flex items-center justify-center md:p-4 p-2 pointer-events-none"
          >
            <div
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800 border border-gray-100 dark:border-slate-700 z-10 pointer-events-auto"
            >
        <div className={`flex items-center justify-between border-b p-4 ${metadata.headerBg}`}>
          <div className="flex items-center gap-3">
            {metadata.icon}
            <h3 className={`text-lg font-black uppercase tracking-tight ${type === 'profile' ? 'text-inherit' : 'text-gray-800 dark:text-white'}`}>
              {metadata.title}
            </h3>
          </div>

          <button
            onClick={handleCloseWithAnimation}
            className={`rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10 ${type === 'profile' ? 'text-inherit opacity-80 hover:opacity-100' : 'text-gray-400'}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="md:p-5 p-3 max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-4">
            
            {/* DAILY */}
            {type === 'daily' && (
              <div className="space-y-4">
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

                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl text-center">
                  <p className="text-xs uppercase tracking-widest text-gray-400">Daily Total Score</p>
                  <p className="text-5xl font-black text-emerald-500 font-digital mt-2">
                    {activeDayEntries.reduce((s, e) => s + e.points, 0)}
                  </p>
                </div>

                <div className="md:space-y-2 space-y-1">
                  {activeDayEntries
                    .slice()
                    .sort((a, b) => {
                      const timeA = a.fromTime || a.toTime;
                      const timeB = b.fromTime || b.toTime;
                      return timeA.localeCompare(timeB);
                    })
                    .map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          const itemDate = item.fromDate || item.toDate;
                          onSelectDate(itemDate);
                          handleCloseWithAnimation();
                          setTimeout(() => {
                            scrollToActivity(item.id, itemDate);
                          }, 400);
                        }}
                        className={`w-full text-left p-3 rounded-2xl transition-all border ${
                          goals.some(g => g.code === item.code && g.achievedAt === (item.fromDate || item.toDate))
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
                              {item.isLongEvent ? `${item.fromTime || item.toTime} – ${item.toTime || item.fromTime}` : item.fromTime || item.toTime}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-emerald-500 font-black">
                              {item.points >= 0 ? `+${item.points}` : item.points}
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
                      Total Months Points
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
                        (activeYearEntries.reduce((s, e) => s + e.points, 0) / (365 * 100)) * 100,
                        100
                      ).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="md:space-y-2 space-y-1">
                  {[...Array(12)].map((_, i) => {
                    const monthDate = `${activeYear}-${String(i + 1).padStart(2, '0')}`;
                    const data = entries.filter(e => (e.fromDate || e.toDate).startsWith(monthDate));
                    const score = data.reduce((s, e) => s + e.points, 0);
                    const progress = Math.min((score / (30 * 100)) * 100, 100);

                    return (
                      <button
                        key={monthDate}
                        onClick={() => {
                          const firstDate = `${monthDate}-01`;
                          onSelectDate(firstDate);
                          handleCloseWithAnimation();
                          setTimeout(() => {
                            scrollToActivities();
                          }, 300);
                        }}
                        disabled={score === 0}
                        className={`w-full p-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 ${
                          score === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500/30'
                        } transition-all`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500">
                              {activeYear.toString().slice(-2)}
                            </div>
                            <div className="text-left">
                              <p className="font-black text-gray-800 dark:text-white">
                                {new Date(`${monthDate}-01`).toLocaleString('default', { month: 'long' })}
                              </p>
                              <p className="text-xs text-gray-400">Month Analytics</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-blue-500">{score}</p>
                            <p className="text-xs text-gray-400">{progress.toFixed(0)}%</p>
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
                {Array.from(new Set([new Date().getFullYear(), ...entries.map(e => new Date(e.fromDate || e.toDate).getFullYear())]))
                  .sort((a, b) => (b as number) - (a as number))
                  .map(year => {
                    const score = entries
                      .filter(e => new Date(e.fromDate || e.toDate).getFullYear() === year)
                      .reduce((s, e) => s + (e.points || 0), 0);

                    return (
                      <button
                        key={year}
                        onClick={() => {
                          const targetDate = `${year}-01-01`;
                          onSelectDate(targetDate);
                          handleCloseWithAnimation();
                        }}
                        className="w-full text-left p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-indigo-500/40 transition-all cursor-pointer block"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400 uppercase">Year</p>
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white">{year}</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-black text-indigo-500 font-digital">{score}</p>
                            <p className="text-xs text-gray-400">Total Points</p>
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
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveYear(prev => prev - 1)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="text-center">
                    <p className="text-xs uppercase text-gray-400">Goals of</p>
                    <h3 className="text-lg font-black text-gray-800 dark:text-white">{activeYear}</h3>
                  </div>

                  <button
                    onClick={() => setActiveYear(prev => prev + 1)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-2xl text-center">
                  <p className="text-xs uppercase tracking-widest text-gray-400">Yearly Goals Achieved</p>
                  <p className="text-5xl font-black text-purple-500 font-digital mt-2">
                    {goals.filter(g => g.achievedAt && new Date(g.achievedAt).getFullYear() === activeYear).length}
                  </p>
                </div>

                <div className="md:space-y-2 space-y-1">
                  {goals
                    .filter(g => g.achievedAt && new Date(g.achievedAt).getFullYear() === activeYear)
                    .slice()
                    .sort((a, b) => {
                      const dateA = new Date(a.achievedAt!).getTime();
                      const dateB = new Date(b.achievedAt!).getTime();
                      if (dateA !== dateB) return dateA - dateB;

                      const timeA = entries.find(e => (e.fromDate || e.toDate) === a.achievedAt && e.code === a.code)?.fromTime || "";
                      const timeB = entries.find(e => (e.fromDate || e.toDate) === b.achievedAt && e.code === b.code)?.fromTime || "";
                      return timeA.localeCompare(timeB);
                    })
                    .map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          if (!g.achievedAt) return;
                          onSelectDate(g.achievedAt);
                          handleCloseWithAnimation();
                          setTimeout(() => {
                            const found = entries.find(e => (e.fromDate || e.toDate) === g.achievedAt && e.code === g.code);
                            if (found) scrollToActivity(found.id, found.fromDate || found.toDate);
                          }, 400);
                        }}
                        className="w-full p-3 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-left">
                            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
                              <Star size={16} className="text-purple-500" fill="currentColor" />
                            </div>
                            <div>
                              <p className="font-black text-gray-800 dark:text-white leading-tight">{g.name}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(g.achievedAt!).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-500">{g.points >= 0 ? `+${g.points}` : g.points}</p>
                            <p className="text-[10px] text-gray-400 uppercase">Goal</p>
                          </div>
                        </div>
                      </button>
                    ))}

                  {goals.filter(g => g.achievedAt && new Date(g.achievedAt).getFullYear() === activeYear).length === 0 && (
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
                    {new Date(activeDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
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

                <div className="flex flex-wrap-reverse gap-2 w-full">
                  <div className="flex-grow flex-shrink-0 basis-[calc(33.333%-0.5rem)] min-w-[105px] p-3 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 text-center">
                    <p className="text-[10px] uppercase text-gray-400">Credit</p>
                    <p className="text-xs sm:text-base font-black mt-1 text-emerald-500 break-all">+ {financialSummary.credit}</p>
                  </div>

                  <div className="flex-grow flex-shrink-0 basis-[calc(33.333%-0.5rem)] min-w-[105px] p-3 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 text-center">
                    <p className="text-[10px] uppercase text-gray-400">Debit</p>
                    <p className="text-xs sm:text-base font-black mt-1 text-red-500 break-all">- {financialSummary.debit}</p>
                  </div>
                  
                  <div className={`flex-grow flex-shrink-0 basis-[calc(33.333%-0.5rem)] min-w-[105px] p-3 rounded-xl text-center ${
                    financialSummary.balance >= 0
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20'
                      : 'bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20'
                  }`}>
                    <p className="text-[10px] uppercase text-gray-400">Balance</p>
                    <p className={`text-xs sm:text-base font-black mt-1 break-all ${financialSummary.balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {financialSummary.balance >= 0 ? '' : ''}
                       {getCurrencySymbol(getAggregateCurrencyDisplay(activeMonthEntries))} 
                      {Math.abs(financialSummary.balance)}
                    </p>
                  </div>
                </div>

                <div className="md:space-y-2 space-y-1">
                  {activeMonthEntries
                    .filter(e => e.credit || e.debit)
                    .slice()
                    .sort((a, b) => {
                      const dateCompare = (a.fromDate || a.toDate).localeCompare(b.fromDate || b.toDate);
                      if (dateCompare !== 0) return dateCompare;
                      const timeA = a.fromTime || a.toTime || "";
                      const timeB = b.fromTime || b.toTime || "";
                      return timeA.localeCompare(timeB);
                    })
                    .map(item => {
                      const isGoalAchieved = goals.some(g => g.code === item.code && g.achievedAt === (item.fromDate || item.toDate));
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            const itemDate = item.fromDate || item.toDate;
                            onSelectDate(itemDate);
                            handleCloseWithAnimation();
                            setTimeout(() => {
                              scrollToActivity(item.id, itemDate);
                            }, 350);
                          }}
                          className={`w-full p-3 rounded-2xl border transition-all ${
                            isGoalAchieved
                              ? 'border-emerald-500/40 shadow-md shadow-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' 
                              : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900'
                          } hover:border-emerald-500/40`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <p className="font-black text-gray-800 dark:text-white leading-tight">{item.name}</p>
                              <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-tight mt-0.5">
                                {item.isLongEvent ? `${item.fromTime || item.toTime} – ${item.toTime || item.fromTime}` : item.fromTime || item.toTime}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-1">
                                {new Date(item.fromDate || item.toDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()}
                              </p>
                              {item.credit > 0 && <p className="font-black text-emerald-500 leading-none">+{item.credit}{getCurrencySymbol(item.moneyCode)}</p>}
                              {item.debit > 0 && <p className="font-black text-red-500 leading-none">-{item.debit}{getCurrencySymbol(item.moneyCode)}</p>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* PROFILE PERFORMANCE CARD */}
            {type === 'profile' && (
              !isHeavyUiReady ? (
                <div className="space-y-4 ">
                  {/* Skeleton for Navigation Block */}
                  <div className="flex items-center justify-between bg-slate-100/60 dark:bg-slate-950/40 border border-gray-100/50 dark:border-slate-800/50 p-2.5 rounded-2xl h-[58px]">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                    <div className="space-y-1.5 flex flex-col items-center">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-slate-800 rounded-full" />
                      <div className="w-12 h-3.5 bg-gray-200 dark:bg-slate-800 rounded-full" />
                    </div>
                    <div className="w-8 h-8 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                  </div>

                  {/* Skeleton for Profile Header Card */}
                  <div className="p-6 rounded-3xl bg-slate-100/60 dark:bg-slate-950/40 border border-gray-100/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 h-42">
                    <div className="space-y-3 w-full sm:w-auto flex flex-col items-center sm:items-start">
                      <div className="w-40 h-7 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                      <div className="w-24 h-2.5 bg-gray-200 dark:bg-slate-800 rounded-full" />
                    </div>
                    <div className="w-32 h-9 bg-gray-200 dark:bg-slate-800 rounded-xl" />
                  </div>

                  {/* Skeleton for Rank Progression */}
                  <div className="bg-slate-100/60 dark:bg-slate-950/40 border border-gray-100/50 dark:border-slate-800/50 p-5 rounded-3xl space-y-4 h-[100px] flex flex-col justify-center">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1.5">
                        <div className="w-20 h-2 bg-gray-200 dark:bg-slate-800 rounded-full" />
                        <div className="w-32 h-3.5 bg-gray-200 dark:bg-slate-800 rounded-full" />
                      </div>
                      <div className="space-y-1.5 flex flex-col items-end">
                        <div className="w-12 h-2 bg-gray-200 dark:bg-slate-800 rounded-full" />
                        <div className="w-16 h-3 bg-gray-200 dark:bg-slate-800 rounded-full" />
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-slate-800 rounded-full" />
                  </div>

                  {/* Skeleton for Heatmap */}
                  <div className="bg-slate-100/60 dark:bg-slate-950/40 border border-gray-100/50 dark:border-slate-800/50 p-5 rounded-3xl space-y-4 h-[180px] flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                      <div className="space-y-2">
                        <div className="w-48 h-3.5 bg-gray-200 dark:bg-slate-800 rounded-full" />
                        <div className="w-32 h-2 bg-gray-200 dark:bg-slate-800 rounded-full" />
                      </div>
                      <div className="w-12 h-5 bg-gray-200 dark:bg-slate-800 rounded-full" />
                    </div>
                    <div className="w-full h-24 bg-gray-200 dark:bg-slate-800 rounded-2xl" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Global Profile Year Controls Navigation Block */}
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 p-2.5 rounded-2xl">
                  <button
                    onClick={() => setProfileYear(prev => prev - 1)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Inspecting Journal Year</p>
                    <h4 className="text-base font-black text-indigo-500 dark:text-indigo-400 font-digital">{profileYear}</h4>
                  </div>
                  <button
                    onClick={() => setProfileYear(prev => prev + 1)}
                    className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Profile Header Card */}
                <div className={`p-6 rounded-3xl ${currentTimeClass || 'bg-slate-900'} relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg border border-white/10`}>
                  <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.08]">
                    <Trophy size={160} />
                  </div>
                  
                  <div className="text-center sm:text-left z-10 space-y-1 w-full sm:w-auto">
                    <AnimatePresence mode="wait" initial={false}>
                      {isEditingName ? (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 justify-center sm:justify-start"
                        >
                          <input
                            ref={nameInputRef}
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-[70%] sm:w-auto sm:min-w-[240px] text-2xl font-black uppercase tracking-tight bg-white/20 border-b-2 border-white outline-none text-white px-2 py-1 rounded-t-lg"
                            autoFocus
                          />
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={(e) => { e.stopPropagation(); handleSaveName(); }}
                            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-sm"
                          >
                            <Check size={18} />
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={(e) => { e.stopPropagation(); setEditNameValue(userName); setIsEditingName(false); }}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-full transition-colors backdrop-blur-sm"
                          >
                            <X size={18} />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="viewing"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className="flex items-center gap-2 justify-center sm:justify-start group text-left cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }}
                        >
                          <h3 className="text-3xl md:text-4xl uppercase font-black tracking-tight leading-none text-white group-hover:underline decoration-dotted decoration-2">
                            {userName || "Guest"}
                          </h3>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="opacity-0 group-hover:opacity-100 text-white/60 hover:text-white transition-all p-1"
                            title="Edit name"
                          >
                            <Edit2 size={16} />
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <p className="text-[10px] pt-2 font-black tracking-widest uppercase opacity-80 text-white/90">
                      Annual Journal Performance Card
                    </p>
                  </div>

                  <div className="text-center sm:text-right z-10 flex flex-col items-center sm:items-end gap-1">
                    <div className="px-4 py-2 rounded-2xl border font-black text-xs inline-flex items-center gap-2 backdrop-blur-md bg-white/20 border-white/30 shadow-sm">
                      <Trophy size={14} className="text-amber-300" />
                      <span className="tracking-wide">{profileStats.rank}</span>
                    </div>
                    <p className="text-[9px] mt-1 text-white/75 uppercase tracking-wider font-semibold">
                      Rank evaluated by tracking year points
                    </p>
                  </div>
                </div>

                {/* Rank Progression */}
                {(() => {
                  const isLeapYear = (profileYear % 4 === 0 && profileYear % 100 !== 0) || (profileYear % 400 === 0);
                  const maxYearPoints = isLeapYear ? 36600 : 36500;
                  const progressPercent = Math.min(Math.max((profileStats.totalPointsYear / maxYearPoints) * 100, 0), 100);
                  const pointsLeft = maxYearPoints - profileStats.totalPointsYear;

                  return (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
                      <div className="flex justify-between items-end text-xs">
                        <div className="space-y-0.5">
                          <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest block">Rank Progression</span>
                          <span className="text-sm font-black text-gray-800 dark:text-gray-200">{profileStats.rank}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block leading-tight">{profileStats.trackingYear}</span>
                          <span className="text-xs font-black text-gray-600 dark:text-gray-400">
                            {pointsLeft > 0 ? `${pointsLeft} pts left` : 'Max level reached!'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="w-full h-4 bg-gray-200/60 dark:bg-slate-800/85 rounded-full overflow-hidden p-[3px] border border-gray-100 dark:border-slate-800">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2 px-1 text-[9px] font-mono text-gray-400 font-bold uppercase tracking-wider">
                          <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progressPercent)}% LEVEL SECURED</span>
                          <span>{profileStats.totalPointsYear} / {maxYearPoints} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Annual Calendar Heatmap Card */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-indigo-500" size={18} />
                      <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
                          {profileStats.trackingYear} Annual Journey Heatmap
                        </h4>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-md text-center bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                        GRADE {profileStats.annualGradeYear}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">
                        {profileStats.activeDaysCountYear} / {profileStats.trackingYear % 4 === 0 ? 366 : 365} Days
                      </div>
                    </div>
                  </div>

                  <div className="relative pt-1">
                    <HeatMap
                      year={profileStats.trackingYear}
                      entries={entries}
                      themeColor="indigo"
                      onDayClick={(dateStr) => {
                        onSelectDate(dateStr);
                        handleCloseWithAnimation();
                        setTimeout(() => {
                          scrollToActivities();
                        }, 300);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 dark:text-gray-500 pt-2.5 border-t border-gray-100 dark:border-slate-850 mt-1">
                    <div className="flex items-center gap-1.5">
                      <span>Less active</span>
                      <div className="w-2.5 h-2.5 rounded-[2.5px] bg-gray-200/60 dark:bg-slate-800/80" />
                      <div className="w-2.5 h-2.5 rounded-[2.5px] bg-indigo-500/20 dark:bg-indigo-500/20" />
                      <div className="w-2.5 h-2.5 rounded-[2.5px] bg-indigo-500/40 dark:bg-indigo-500/45" />
                      <div className="w-2.5 h-2.5 rounded-[2.5px] bg-indigo-500/75 dark:bg-indigo-500/80" />
                      <div className="w-2.5 h-2.5 rounded-[2.5px] bg-indigo-600 dark:bg-indigo-500" />
                      <span>More active</span>
                    </div>
                    <div className="uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <span>Classification: </span>
                      <span className="text-gray-700 dark:text-gray-300">{profileStats.annualGradeDescription}</span>
                    </div>
                  </div>
                </div>

                {/* Statistics Bento Grid (Strictly Filtered by Year Navigation Selection) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Yearly Points */}
                  <div className="bg-gradient-to-br from-amber-500/[0.03] to-amber-500/[0.07] border border-amber-500/10 p-4 rounded-3xl flex flex-col justify-between min-h-[3rem] h-auto relative overflow-hidden group hover:border-amber-500/25 transition-all shadow-sm">
                    <div className="absolute top-2 right-2 opacity-10 group-hover:scale-110 transition-transform">
                      <Star size={40} className="text-amber-500" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Yearly Points</p>
                    <div className="flex flex-wrap items-baseline gap-1 mt-1">
                      <span className="text-2xl sm:text-3xl font-black text-amber-500 font-digital leading-none break-all">{profileStats.totalPointsYear}</span>
                      <span className="text-[10px] sm:text-xs text-amber-500/70 font-bold uppercase tracking-wider ml-0.5">PTS</span>
                    </div>
                  </div>

                  {/* Action Logs */}
                  <div className="bg-gradient-to-br from-blue-500/[0.03] to-blue-500/[0.07] border border-blue-500/10 p-4 rounded-3xl flex flex-col justify-between min-h-[3rem] h-auto relative overflow-hidden group hover:border-blue-500/25 transition-all shadow-sm">
                    <div className="absolute top-2 right-2 opacity-10 group-hover:scale-110 transition-transform">
                      <Activity size={40} className="text-blue-500" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Actions</p>
                    <div className="flex flex-wrap items-baseline gap-1 mt-1">
                      <span className="text-2xl sm:text-3xl font-black text-blue-500 font-digital leading-none break-all">{profileStats.totalActivitiesYear}</span>
                      <span className="text-[10px] sm:text-xs text-blue-500/70 font-bold uppercase tracking-wider ml-0.5">logs</span>
                    </div>
                  </div>

                  {/* Target Goals Met */}
                  <div className="bg-gradient-to-br from-pink-500/[0.03] to-pink-500/[0.07] border border-pink-500/10 p-4 rounded-3xl flex flex-col justify-between min-h-[3rem] h-auto relative overflow-hidden group hover:border-pink-500/25 transition-all shadow-sm">
                    <div className="absolute top-2 right-2 opacity-10 group-hover:scale-110 transition-transform">
                      <Target size={40} className="text-pink-500" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Target Goals Met</p>
                    <div className="flex flex-wrap items-baseline gap-1 mt-1">
                      <span className="text-2xl sm:text-3xl font-black text-pink-500 font-digital leading-none break-all">
                        {profileStats.completedGoalsYear.length}
                      </span>
                      <span className="text-[10px] sm:text-xs text-pink-500/80 font-bold uppercase tracking-wider ml-0.5">
                        / {profileStats.totalGoalsInYear.length}
                      </span>
                    </div>
                  </div>

                  {/* Avg. Points Output */}
                  <div className="bg-gradient-to-br from-emerald-500/[0.03] to-emerald-500/[0.07] border border-emerald-500/10 p-4 rounded-3xl flex flex-col justify-between min-h-[3rem] h-auto relative overflow-hidden group hover:border-emerald-500/25 transition-all shadow-sm">
                    <div className="absolute top-2 right-2 opacity-10 group-hover:scale-110 transition-transform">
                      <TrendingUp size={40} className="text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Daily Score Avg</p>
                    <div className="flex flex-wrap items-baseline gap-1 mt-1">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-500 font-digital leading-none break-all">{profileStats.avgPointsPerDayYear}</span>
                      <span className="text-[10px] sm:text-xs text-emerald-500/70 font-bold uppercase tracking-wider ml-0.5">pts/d</span>
                    </div>
                  </div>
                </div>

                {/* Financial Standings Sub-Card */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins size={16} className="text-teal-500" />
                    <h4 className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">Financial Standings ({profileYear})</h4>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1">
                    <div className="p-1 rounded-2xl bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] border border-emerald-500/10 flex flex-col justify-between items-center min-h-[2.5rem] h-auto text-center">
                      <p className="text-[9px] uppercase font-bold text-gray-400">Total Credit</p>
                      <p className="text-xs sm:text-sm font-black text-emerald-500 mt-1 break-all leading-snug">
                        + {getCurrencySymbol(getAggregateCurrencyDisplay(entries))} {profileStats.totalCreditYear}
                      </p>
                    </div>
                    <div className="p-1 rounded-2xl bg-red-500/[0.02] dark:bg-red-500/[0.01] border border-red-500/10 flex flex-col justify-between items-center min-h-[2.5rem] h-auto text-center">
                      <p className="text-[9px] uppercase font-bold text-gray-400">Total Debit</p>
                      <p className="text-xs sm:text-sm font-black text-red-500 mt-1 break-all leading-snug">
                        - {getCurrencySymbol(getAggregateCurrencyDisplay(entries))} {profileStats.totalDebitYear}
                      </p>
                    </div>
                    <div className={`p-1 rounded-2xl border flex flex-col justify-between items-center min-h-[2.5rem] h-auto text-center ${profileStats.netBalanceYear >= 0 ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] border-emerald-500/10' : 'bg-red-500/[0.02] dark:bg-red-500/[0.01] border-red-500/10'}`}>
                      <p className="text-[9px] uppercase font-bold text-gray-400">Net Wealth</p>
                      <p className={`text-xs sm:text-sm font-black mt-1 break-all leading-snug ${profileStats.netBalanceYear >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {getCurrencySymbol(getAggregateCurrencyDisplay(entries))} {profileStats.netBalanceYear}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Goals Overview Block (Now Filtered By profileYear State Navigation Window) */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-slate-850 pb-2">
                    <div className="flex items-center gap-2">
                      <ListTodo size={16} className="text-purple-500" />
                      <h4 className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider">Target Goals Status</h4>
                    </div>
                    <span className="text-[10px] font-black bg-purple-500/10 text-purple-650 dark:text-purple-400 px-2.5 py-0.5 rounded-full uppercase">
                      {profileStats.completedGoalsYear.length} / {profileStats.totalGoalsInYear.length} Achieved
                    </span>
                  </div>

                  <div className="space-y-2 w-full">
                    {goals
                      .filter(g => 
                        (g.achievedAt && new Date(g.achievedAt).getFullYear() === profileYear) || 
                        (!g.achievedAt && parseInt(g.deadlineYear) === profileYear)
                      )
                      .map(g => {
                        const matchedEntry = entries
                          .filter(e => e.code === g.code && (g.achievedAt ? (e.fromDate || e.toDate) === g.achievedAt : true))
                          .sort((a, b) => (a.fromDate || a.toDate).localeCompare(b.fromDate || b.toDate) || (a.fromTime || a.toTime).localeCompare(b.fromTime || b.toTime))[0];

                        return (
                          <div 
                            key={g.id} 
                            onClick={() => {
                              if (matchedEntry) {
                                const mDate = matchedEntry.fromDate || matchedEntry.toDate;
                                onSelectDate(mDate);
                                handleCloseWithAnimation();
                                setTimeout(() => {
                                  scrollToActivity(matchedEntry.id, mDate);
                                }, 400);
                              }
                            }}
                            className={`flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-gray-50 dark:border-slate-700/50 shadow-sm gap-4 transition-all ${
                              matchedEntry 
                                ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-purple-300 dark:hover:border-purple-800/85 hover:shadow-md active:scale-[0.995]' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className={`w-6 h-6 rounded-lg flex-shrink-0 ${g.achievedAt ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-slate-700 text-gray-400'} flex items-center justify-center`}>
                                <Star size={12} fill={g.achievedAt ? "currentColor" : "none"} />
                              </div>
                              
                              <div className="text-left min-w-0 flex flex-col justify-center">
                                <p className="text-xs font-black text-gray-800 dark:text-white leading-tight truncate mb-0.5">
                                  {g.name}
                                </p>
                                <p className="text-[9px] font-medium text-gray-400 dark:text-gray-400">
                                  Code: {g.code}
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex flex-col items-end justify-center flex-shrink-0 gap-1.5">
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-digital font-bold">
                                  {g.points >= 0 ? `+${g.points}` : g.points} p
                                </span>
                              </div>
                              
                              <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                {g.achievedAt ? formatGoalDate(g.achievedAt) : `${g.deadlineMonth.substring(0, 3).toUpperCase()} ${g.deadlineYear}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {goals.filter(g => 
                      (g.achievedAt && new Date(g.achievedAt).getFullYear() === profileYear) || 
                      (!g.achievedAt && parseInt(g.deadlineYear) === profileYear)
                    ).length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-400">
                        No goals configured for {profileYear}
                      </div>
                    )}
                  </div>
                </div>

                {/* Journey Timeline details */}
                <div className="flex justify-between text-[9px] text-gray-400 dark:text-gray-500 p-1 font-mono">
                  <span>FIRST ENTRY: {entries.length > 0 ? (() => {
                    const sorted = entries.slice().sort((a,b) => (a.fromDate || a.toDate).localeCompare(b.fromDate || b.toDate));
                    return sorted[0].fromDate || sorted[0].toDate;
                  })() : 'Never'}</span>
                  <span>LAST ENTRY: {entries.length > 0 ? (() => {
                    const sorted = entries.slice().sort((a,b) => (b.fromDate || b.toDate).localeCompare(a.fromDate || a.toDate));
                    return sorted[0].fromDate || sorted[0].toDate;
                  })() : 'Never'}</span>
                </div>
              </div>
            )
          )}
          </div>
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>,
document.body
  );
};

export default QuickPopData;