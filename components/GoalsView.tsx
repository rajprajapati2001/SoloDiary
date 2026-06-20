import React, { useState, useRef } from 'react';
import { Goal } from '../types';
import { X, Plus, Trash2, Target, CheckCircle, Edit2, Flag, Search } from 'lucide-react'; // Added Search icon

interface GoalsViewProps {
  userName: string;
  goals: Goal[];
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onEditGoal: (goal: Goal) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ userName, goals, onAddGoal, onDeleteGoal, onEditGoal }) => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deadlineMonth, setDeadlineMonth] = useState(currentMonthName);
  const [deadlineYear, setDeadlineYear] = useState(currentYear);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [points, setPoints] = useState(0);
  const [searchTerm, setSearchTerm] = useState(''); // Added search state

  const formRef = useRef<HTMLDivElement>(null);

  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Logic: Filter by search term, then sort by achievement status and date
  const filteredGoals = goals.filter(goal => 
    goal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.deadlineMonth.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    if (a.achievedAt && !b.achievedAt) return 1;
    if (!a.achievedAt && b.achievedAt) return -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      deadlineMonth,
      deadlineYear,
      code,
      name,
      points,
    };

    if (editingId) {
      const existing = goals.find(g => g.id === editingId);
      onEditGoal({
        ...goalData,
        achievedAt: existing?.achievedAt,
        createdAt: existing?.createdAt || Date.now(),
      });
    } else {
      onAddGoal({ ...goalData, createdAt: Date.now() });
    }
    setShowForm(false);
    reset();
  };

  const startEdit = (goal: Goal) => {
    if (goal.achievedAt) return;
    setEditingId(goal.id);
    setDeadlineMonth(goal.deadlineMonth);
    setDeadlineYear(goal.deadlineYear || currentYear);
    setCode(goal.code);
    setName(goal.name);
    setPoints(goal.points);
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const reset = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setPoints(0);
    setDeadlineMonth(currentMonthName);
    setDeadlineYear(currentYear);
  };

  const toggleForm = () => {
    if (showForm) {
      reset();
      setShowForm(false);
    } else {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const formatAchievedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="space-y-6 dark:text-white text-black">
      
<div className="relative flex justify-between items-center md:gap-4 md:p-4 p-1 overflow-visible">
  {/* Large Decorative Background Icon */}
  <div className="absolute top-1 -translate-y-10 -right-10 text-emerald-500/20 dark:text-emerald-400/15 pointer-events-none select-none z-0 transform rotate-12">
    <Target size={180} strokeWidth={1.2} />
  </div>

  {/* Left Section: Icon + Headings */}
  <div className="flex items-center gap-4 relative z-10">
    {/* Upgraded Target Icon Badge */}
    <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm shadow-emerald-100/50 dark:shadow-none shrink-0 transition-transform hover:scale-105">
      <Target size={24} strokeWidth={2.2} />
      {/* Subtle glow effect breaking outside the badge */}
      <span className="absolute inset-0 rounded-xl bg-emerald-400/20 blur-xl -z-10 animate-pulse" />
    </div>

    <div>
      <h2 ref={formRef} className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
        Manage Goals
      </h2>
      <p className="text-[10px] md:text-xs font-bold opacity-60 dark:opacity-50 text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
        Dream big, stay consistent
      </p>
    </div>
  </div>

  {/* Right Section: Premium Action Button */}
  <button
    onClick={toggleForm}
    className={`flex items-center gap-2 text-white px-4 py-3 rounded-xl font-semibold text-sm tracking-wide shadow-md transition-all duration-300 transform active:scale-95 shrink-0 select-none ${
      showForm 
        ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30' 
        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30'
    }`}
  >
    <span className={`transform transition-transform duration-300 ${showForm ? 'rotate-90' : 'rotate-0'}`}>
      {!showForm ? <Plus size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
    </span>
    <span className="hidden sm:inline-block font-bold">
      {showForm ? 'Cancel' : 'New Goal'}
    </span>
  </button>
</div>

      {/* --- SEARCH BAR --- */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search objectives, codes, or months..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white outline-none font-bold text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-white/20 backdrop-blur-md shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Month and Year - Side by side on mobile, separate on desktop */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:col-span-2 lg:col-span-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-60 px-1">Month</label>
                <select
                  value={deadlineMonth}
                  onChange={e => setDeadlineMonth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border dark:bg-black/20 dark:border-white/10 outline-none text-sm font-bold dark:text-white"
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-60 px-1">Year</label>
                <select
                  value={deadlineYear}
                  onChange={e => setDeadlineYear(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border dark:bg-black/20 dark:border-white/10 outline-none text-sm font-bold dark:text-white"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Goal Title - Full width on mobile, spans 2 columns on desktop */}
            <div className="space-y-1 lg:col-span-2 md:col-span-3">
              <label className="text-[10px] font-black uppercase opacity-60 px-1">Goal Title</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Objective"
                className="w-full px-4 py-2.5 rounded-xl border dark:bg-black/20 dark:border-white/10 outline-none text-sm font-bold dark:text-white"
                required
              />
            </div>

            {/* Code and Points - Side by side on mobile, separate on desktop */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-1 md:col-span-2 lg:col-span-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-60 px-1">Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="XYZ"
                  className="w-full px-4 py-2.5 uppercase rounded-xl border dark:bg-black/20 dark:border-white/10 outline-none text-sm font-bold dark:text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-60 px-1">Points</label>
                <input
                  type="number"
                  value={points || ""}
                  onChange={e => setPoints(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Pts"
                  className="w-full px-4 py-2.5 rounded-xl border dark:bg-black/20 dark:border-white/10 outline-none text-sm font-bold dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-full mt-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-colors uppercase tracking-widest text-sm">
            {editingId ? 'Update Objective' : 'Save Goal'}
          </button>
        </form>
      )}

      {/* Rest of your JSX code remains the same */}
      <div className="bg-white/10 dark:bg-slate-800/50 rounded-3xl shadow-2xl border border-white/20 overflow-hidden backdrop-blur-md">
        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-white/10">
          {sortedGoals.map(goal => (
            <div key={goal.id} className={`px-4 py-3.5 flex items-start gap-3 ${goal.achievedAt ? 'opacity-60 bg-emerald-500/5' : ''}`}>
              <div className="pt-0.5 shrink-0">
                {goal.achievedAt ? <CheckCircle className="text-emerald-500" size={22} /> : <div className="w-[22px] h-[22px] rounded-full border-2 border-white/20" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Flag size={13} className={`shrink-0 ${goal.achievedAt ? 'text-emerald-500' : 'text-blue-500'}`} />
                    <span className={`font-bold text-[15px] truncate ${goal.achievedAt ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {goal.name}
                    </span>
                  </div>
                  <span className="font-black text-blue-500 text-sm shrink-0">{goal.points >= 0 ? `+${goal.points}` : goal.points} </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider text-[10px] border border-blue-500/20">{goal.code}</span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wide">
                    {goal.deadlineMonth} {goal.deadlineYear || currentYear}
                  </span>
                </div>
                {goal.achievedAt && (
                  <div className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded mt-1.5 inline-block">
                    Completed: {formatAchievedDate(goal.achievedAt)}
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-0.5 pt-0.5">
                {!goal.achievedAt ? (
                  <>
                    <button onClick={() => startEdit(goal)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => onDeleteGoal(goal.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                  </>
                ) : (
                  <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Archived</span>
                )}
              </div>
            </div>
          ))}
          {sortedGoals.length === 0 && (
            <div className="p-12 text-center text-gray-400 dark:text-slate-500 italic">
              {searchTerm ? "No goals match your search." : "No objectives recorded."}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-black/10">
              <tr>
                <th className="pl-5 pr-2 py-3 text-[10px] font-black uppercase opacity-60 w-12 text-center">Done</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase opacity-60 w-24">Code</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase opacity-60">Task / Deadline</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase opacity-60 w-16 text-center">Pts</th>
                <th className="pl-3 pr-5 py-3 text-[10px] font-black uppercase opacity-60 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedGoals.map(goal => (
                <tr key={goal.id} className={`${goal.achievedAt ? 'opacity-60 bg-emerald-500/5' : ''} hover:bg-white/5 transition-colors group`}>
                  <td className="pl-5 pr-2 py-3.5 text-center align-top pt-4">
                    {goal.achievedAt ? <CheckCircle className="text-emerald-500 mx-auto" size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-white/20 mx-auto" />}
                  </td>
                  <td className="px-3 whitespace-nowrap py-3.5 align-top pt-4">
                    <span className="font-black text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider text-xs border border-blue-500/20">{goal.code}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Flag size={13} className={`shrink-0 ${goal.achievedAt ? 'text-emerald-500' : 'text-blue-500'}`} />
                      <span className={`font-bold text-base ${goal.achievedAt ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {goal.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mt-0.5 tracking-wide ml-[21px]">
                      Expires: {goal.deadlineMonth} {goal.deadlineYear || currentYear}
                    </div>
                    {goal.achievedAt && (
                      <div className="text-[10px] font-black text-emerald-500 uppercase mt-1 bg-emerald-500/10 px-2 py-0.5 rounded inline-block ml-[21px]">
                        Completed: {formatAchievedDate(goal.achievedAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3.5 font-black text-blue-500 text-base text-center align-top pt-4">{goal.points >= 0 ? `+${goal.points}` : goal.points} </td>
                  <td className="pl-3 pr-5 py-3.5 text-right align-top pt-3">
                    {!goal.achievedAt ? (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(goal)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteGoal(goal.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
              {sortedGoals.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">
                    {searchTerm ? "No goals match your search." : "No objectives recorded."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GoalsView;