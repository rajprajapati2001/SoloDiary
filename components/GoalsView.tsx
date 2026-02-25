import React, { useState, useRef } from 'react';
import { Goal } from '../types';
import { X, Plus, Trash2, CheckCircle, Edit2, Flag, Search } from 'lucide-react'; // Added Search icon

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
      <div className="flex justify-between items-center">
        <div>
          <h2 ref={formRef} className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Manage Goals</h2>
          <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1 text-gray-600 dark:text-slate-400">Dream big, stay consistent</p>
        </div>
        <button
          onClick={toggleForm} 
          className={`text-white px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 relative overflow-hidden ${
            showForm ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {!showForm ? (
            <Plus size={18} />
          ) : (
            <X size={18} />
          )}
          <span className="hidden sm:inline-block">
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
                  className="w-full px-4 py-2.5 rounded-xl border dark:bg-black/20 dark:border-white/10 outline-none text-sm font-bold dark:text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-60 px-1">Points</label>
                <input
                  type="number"
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
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
            <div key={goal.id} className={`p-4 flex flex-col gap-1 ${goal.achievedAt ? 'opacity-60 bg-emerald-500/5' : ''}`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {goal.achievedAt ? <CheckCircle className="text-emerald-500" size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-white/20" />}
                  <span className="font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg uppercase tracking-wider text-xs border border-blue-500/20">{goal.code}</span>
                </div>
                <span className="font-black text-blue-500 text-lg">+{goal.points}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Flag size={14} className={goal.achievedAt ? 'text-emerald-500' : 'text-blue-500'} />
                  <div className={`font-bold text-base ${goal.achievedAt ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                    {goal.name}
                  </div>
                </div>
                <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                  Expires: {goal.deadlineMonth} {goal.deadlineYear || currentYear}
                </div>
                {goal.achievedAt && (
                  <div className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded self-start mt-1">
                    Completed: {formatAchievedDate(goal.achievedAt)}
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                {!goal.achievedAt ? (
                  <>
                    <button onClick={() => startEdit(goal)} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={18} /></button>
                    <button onClick={() => onDeleteGoal(goal.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                  </>
                ) : (
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Archived</span>
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
                <th className="px-6 py-4 text-[10px] font-black uppercase opacity-60 w-16 text-center">Done</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase opacity-60">ID Code</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase opacity-60">Task / Deadline</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase opacity-60">Pts</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase opacity-60 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedGoals.map(goal => (
                <tr key={goal.id} className={`${goal.achievedAt ? 'opacity-60 bg-emerald-500/5' : ''} hover:bg-white/5 transition-colors group`}>
                  <td className="px-6 py-4 text-center">
                    {goal.achievedAt ? <CheckCircle className="text-emerald-500 mx-auto" size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-white/20 mx-auto" />}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-lg uppercase tracking-wider text-sm border border-blue-500/20">{goal.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Flag size={14} className={goal.achievedAt ? 'text-emerald-500' : 'text-blue-500'} />
                      <div className={`font-bold text-lg ${goal.achievedAt ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {goal.name}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-blue-500 uppercase mt-0.5 tracking-widest">
                      Expires: {goal.deadlineMonth} {goal.deadlineYear || currentYear}
                    </div>
                    {goal.achievedAt && (
                      <div className="text-[10px] font-black text-emerald-500 uppercase mt-1 bg-emerald-500/10 px-2 py-0.5 rounded inline-block">
                        Completed: {formatAchievedDate(goal.achievedAt)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-black text-blue-500 text-lg">+{goal.points}</td>
                  <td className="px-6 py-4 text-right">
                    {!goal.achievedAt ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(goal)} className="p-2 text-gray-400 hover:text-blue-500"><Edit2 size={18} /></button>
                        <button onClick={() => onDeleteGoal(goal.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Archived</span>
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