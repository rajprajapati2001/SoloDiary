import React, { useState, useEffect, useRef } from 'react';
import CalendarView from './CalendarView';
import LineGraph from './LineGraph';
import Footer from './Footer';
import { ActivityEntry, Goal } from '../types';
import { TrendingUp, Award, Edit2, Trash2, Star, Banknote, Eye, EyeOff, Target, Calendar, Paperclip,ChartLine, ScrollText, Check, X as CloseIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  userName: string;
  entries: ActivityEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onEdit: (entry: ActivityEntry) => void;
  onDelete: (id: string) => void;
  onUpdateUserName: (newName: string) => void;
  goals?: Goal[];
  currentTimeClass: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userName, entries, selectedDate, onSelectDate, onEdit, onDelete, onUpdateUserName, goals = [], currentTimeClass }) => {
  const [now, setNow] = useState(new Date());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(userName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

    useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    if (editNameValue.trim() && editNameValue.trim() !== userName) {
      onUpdateUserName(editNameValue.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setEditNameValue(userName);
      setIsEditingName(false);
    }
  };

    const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };
  
const [showLabels, setShowLabels] = React.useState(true);
  const dateObj = new Date(selectedDate);
  const selectedYear = dateObj.getFullYear();
  const selectedMonthStr = selectedDate.substring(0, 7);
  
  const firstDayOfMonth = new Date(selectedYear, dateObj.getMonth(), 1);
  const lastDayOfMonth = new Date(selectedYear, dateObj.getMonth() + 1, 0);
  
  const selectedDateEntries = entries
    .filter(e => e.toDate === selectedDate)
    .sort((a, b) => a.toTime.localeCompare(b.toTime));

  const totalPointsSelectedDay = selectedDateEntries.reduce((sum, e) => sum + e.points, 0);
  const dailyTarget = 100;
  const dailyProgressPercent = Math.min((totalPointsSelectedDay / dailyTarget) * 100, 100);

  const daysInMonth = lastDayOfMonth.getDate();
  const monthTarget = daysInMonth * 100; // total month days * 100
  
  const monthEntries = entries.filter(e => e.toDate.startsWith(selectedMonthStr));
  const totalMonthPoints = monthEntries.reduce((sum, e) => sum + e.points, 0);
  const monthProgressPercent = (totalMonthPoints / monthTarget) * 100;

  const totalMonthDebit = monthEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalMonthCredit = monthEntries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const monthCashBalance = totalMonthCredit - totalMonthDebit;

  const yearlyEntries = entries.filter(e => new Date(e.toDate).getFullYear() === selectedYear);
  const totalYearlyPoints = yearlyEntries.reduce((s, e) => s + e.points, 0);
  const yearlyGoalsAchieved = goals.filter(g => g.achievedAt && new Date(g.achievedAt).getFullYear() === selectedYear).length;

  const getGraphData = () => {
    const data = [];
    let current = new Date(firstDayOfMonth);
    while (current <= lastDayOfMonth) {
      const dStr = current.toISOString().split('T')[0];
      const pts = entries.filter(e => e.toDate === dStr).reduce((s, e) => s + e.points, 0);
      const achievedInDay = goals.filter(g => g.achievedAt === dStr);
      data.push({ 
        day: current.getDate(), 
        points: pts, 
        fullDate: dStr,
        achievedGoals: achievedInDay 
      });
      current.setDate(current.getDate() + 1);
    }
    return data;
  };

  const monthName = dateObj.toLocaleString('default', { month: 'long' });
  const monthNameShort = dateObj.toLocaleString('default', { month: 'short' });
  const formattedTrackingDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const formattedActivitiesDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
  const formattedFullActivitiesDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Box with Gradient Background and Right-Aligned Time Card */}
      <div className={`flex flex-col md:flex-row items-center justify-between md:gap-6 gap-3 mb-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border-0 border-gray-100 dark:border-slate-700 shadow-sm ${currentTimeClass}`}>
        <div className="text-center md:text-left  flex-1">
                    {isEditingName ? (
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <input
                ref={nameInputRef}
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="text-2xl w-[70%] text-2xl font-black uppercase tracking-tight bg-white/20 dark:bg-black/20 border-b-2 border-blue-600 outline-none text-gray-900 dark:text-white px-2 py-1 rounded-t-lg"
              />
              <button onClick={handleSaveName} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                <Check size={20} />
              </button>
              <button onClick={() => { setEditNameValue(userName); setIsEditingName(false); }} className="p-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-white rounded-full hover:bg-gray-300 transition-colors">
                <CloseIcon size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 justify-center md:justify-start group">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
            {userName}
          </h2>
          
          <button 
                onClick={() => setIsEditingName(true)} 
                className="w-0 md:w-auto md:p-1.5 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-all focus:opacity-100"
                aria-label="Edit name"
              >
                <Edit2 size={18} />
              </button>
            </div>


          )}
          <p className="text-sm font-medium mt-2">
            <span  className="text-blue-600">Tracking data:</span>
            <span className="ml-2 font-bold">
              {formattedTrackingDate}
            </span>
          </p>
        </div>

        {/* Right — Time Card (Hidden on Mobile) */}
        <div className="
          hidden md:block
          p-2 pr-5 pl-5 rounded-2xl 
          min-w-[230px]
          text-center
          bg-white/20 dark:bg-black/20
          backdrop-blur-lg
          border border-white/30 dark:border-white/10
          shadow-xl
          transition-all duration-700
          hover:scale-105
        ">
          <div className="text-5xl font-digital leading-none tracking-widest text-gray-900 dark:text-white" style={{ fontFamily: "'DigitalDismay', monospace" }}>
            {now.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily 100pt Progress Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Target className="text-emerald-500" size={20} /></div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-gray-800 dark:text-white">Today's Points</h3>
                <p className="text-xs text-gray-500">Daily Target: 100 pts</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-emerald-600 leading-none font-digital">{totalPointsSelectedDay}</span>
              <span className="text-xs font-bold text-gray-400 ml-1">pts</span>
            </div>
          </div>
          <div className="w-full h-4 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden p-1 border border-gray-200 dark:border-slate-700 shadow-inner">
            <div className={`h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-lg`} style={{ width: `${dailyProgressPercent}%` }} />
          </div>
        </div>
        
        {/* Total Month Progress */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Calendar className="text-blue-500" size={20} /></div>
              <div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-gray-800 dark:text-white">Monthly Progress</h3>
                <p className="text-xs text-gray-500">{monthName} Target: {monthTarget.toLocaleString()} pts</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-blue-600 leading-none font-digital">{monthProgressPercent.toFixed(0)}</span>
              <span className="text-1xl font-black text-gray-400 leading-none">%</span>
            </div>
          </div>
          <div className="w-full h-4 bg-gray-100 dark:bg-slate-900 rounded-full overflow-hidden p-1 border border-gray-200 dark:border-slate-700 shadow-inner">
            <div className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${Math.min(monthProgressPercent, 100)}%` }} />
          </div>
        </div>

        
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10"><TrendingUp className="text-blue-500" size={18} /></div>
            <p className="text-[10px] font-bold uppercase text-gray-400">Yearly Points ({selectedYear})</p>
          </div>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{totalYearlyPoints.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10"><Award className="text-purple-500" size={18} /></div>
            <p className="text-[10px] font-bold uppercase text-gray-400">Yearly Goals ({selectedYear})</p>
          </div>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{yearlyGoalsAchieved}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10"><Banknote className="text-emerald-500" size={18} /></div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Transaction of {monthName}</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-black ${monthCashBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {monthCashBalance.toLocaleString()} ₹
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
              <p className="text-[9px] font-bold text-gray-400 uppercase">Total Debit</p>
              <p className="text-sm font-black text-red-500">-{totalMonthDebit.toLocaleString()} ₹</p>
            </div>
            <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-2 rounded-xl border border-gray-100 dark:border-slate-700">
              <p className="text-[9px] font-bold text-gray-400 uppercase">Total Credit</p>
              <p className="text-sm font-black text-emerald-600">+{totalMonthCredit.toLocaleString()} ₹</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CalendarView 
            entries={entries} 
            goals={goals} 
            selectedDate={selectedDate} 
            onSelectDate={onSelectDate} 
            onMonthChange={(m, y) => {
              onSelectDate(`${y}-${m}-01`);
            }}
          />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 pl-2 pr-2 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative">
  <div className="flex justify-between items-start">
    <h3 className="inline-flex items-center gap-5 pl-4 pr-4 text-lg font-bold uppercase tracking-tighter mb-6 text-gray-800 dark:text-white">
      <ChartLine className="text-green-500 shrink-0" size={30}/>
      <span>
        <span className="hidden sm:inline">Point </span>
        Trends of
        <span className="hidden sm:inline"> {monthName} {selectedYear}</span> 
        <span className="md:hidden md:inline"> {monthNameShort} {String(selectedYear).slice(-2)}</span>
      </span>
    </h3>

    {/* Toggle Button */}
    <button 
      onClick={() => setShowLabels(!showLabels)}
      className="p-2 mr-4 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-600 dark:text-slate-300"
      title={showLabels ? "Hide Goal Names" : "Show Goal Names"}
    >
      {showLabels ? <Eye size={18} /> : <EyeOff size={18} />}
    </button>
  </div>
  
  <LineGraph 
  data={getGraphData()} 
  monthName={monthName} 
  showGoalNames={showLabels} 
  variant="dashboard" // This makes stroke 0
/>
</div>
          
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
            {/*notebook-text*/}
<div className="flex items-center justify-between">
            <h3 className="inline-flex items-center md:gap-5 gap-2 text-lg font-bold mb-6 text-gray-800 dark:text-white uppercase tracking-tighter">
  <ScrollText className="text-pink-500 shrink-0" size={30}/>
  
  {/* Mobile: Shows "Activities" | Desktop: Shows "Activities for [Date]" */}
  <span>
    Activities <span className="hidden sm:inline">for {formattedFullActivitiesDate}</span>
    <span className="sm:hidden"> {formattedActivitiesDate}</span>
  </span>
</h3>
  <div className="flex gap-1">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevDate}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white transition-colors shadow-sm"
                  title="Previous Day"
                >
                  <ChevronLeft size={18} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNextDate}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:text-white transition-colors shadow-sm"
                  title="Next Day"
                >
                  <ChevronRight size={18} />
                </motion.button>
              </div>
</div>
            <div className="space-y-3">
              {selectedDateEntries.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic">No activities recorded.</div>
              ) : (
                selectedDateEntries.map(entry => {
                  const isGoal = goals.some(g => g.code === entry.code && g.achievedAt === entry.toDate);
                  const isCash = !!(entry.debit || entry.credit);
                  return (
                    <div key={entry.id} className="group p-4 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isGoal ? 'bg-emerald-600' : 'bg-blue-600'} text-white shadow-lg`}>
                            {entry.code}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-800 dark:text-white">{entry.name}</h4>
                              {isGoal && <Star size={14} className="text-emerald-500" fill="currentColor" />}
                              {isCash && <Banknote size={14} className="text-emerald-500" />}
                            </div>
                            <div className="flex gap-2 items-center mt-0.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                              <p>{entry.isLongEvent ? `${entry.fromTime} — ${entry.toTime}` : entry.toTime}</p>
                              {isCash && (
                                <div className="flex gap-2">
                                  {entry.debit! > 0 && <span className="text-red-500">-{entry.debit}₹</span>}
                                  {entry.credit! > 0 && <span className="text-emerald-500">+{entry.credit}₹</span>}
                                </div>
                              )}
                            </div>
                            {entry.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 italic border-l-2 border-blue-500/20 pl-3 py-1 bg-black/5 dark:bg-white/5 rounded-r-lg">
                                {entry.description}
                              </p>
                            )}
                            {entry.attachment && (
                              <a 
                                href={entry.attachment} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 bg-blue-500/5 px-3 py-1.5 rounded-xl hover:bg-blue-500/10 transition-all border border-blue-500/20 mt-2 shadow-sm"
                              >
                                <Paperclip size={12} /> View Attachment
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-lg font-black ${isGoal ? 'text-emerald-500' : 'text-blue-600'}`}>+{entry.points}</span>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => onEdit(entry)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-all"><Edit2 size={16}/></button>
                            <button onClick={() => onDelete(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
