import React, { useState, useRef, useMemo } from 'react';
import { ActivityTemplate, ActivityEntry, Goal } from '../types';
import { X, Plus, Trash2, Edit2, Zap, AlertCircle, List, Search, NotebookPen, Code, Star } from 'lucide-react';
import { getDB } from '../db';

interface ActivitiesViewProps {
  templates: ActivityTemplate[];
  entries: ActivityEntry[];
  goals: Goal[];
  onAdd: (t: ActivityTemplate) => void;
  onEdit: (t: ActivityTemplate) => void;
  onDelete: (id: string) => void;
}

const ActivitiesView: React.FC<ActivitiesViewProps> = ({ templates = [], entries = [], goals = [], onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [points, setPoints] = useState<number | ''>(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingCount, setMatchingCount] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  // Real-time duplication checks using useMemo
  const isDuplicateName = useMemo(() => {
    const trimmedName = name.trim().toLowerCase();
    if (!trimmedName) return false;
    return templates.some(t => t.id !== editingId && t.name.toLowerCase() === trimmedName);
  }, [name, templates, editingId]);

  const isDuplicateCode = useMemo(() => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) return false;

    // Check against other activity templates
    const duplicateInTemplates = templates.some(t => t.id !== editingId && t.code.toUpperCase() === trimmedCode);
    // Check against existing diary entries (any entry using the code)
    const duplicateInEntries = entries.some(e => e.code && e.code.toUpperCase() === trimmedCode);
    // Check against goals
    const duplicateInGoals = goals.some(g => g.code && g.code.toUpperCase() === trimmedCode);

    return duplicateInTemplates || duplicateInEntries || duplicateInGoals;
  }, [code, templates, entries, goals, editingId]);

  // Filter and then sort
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTemplates = [...filteredTemplates].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    const duplicateCodeObj = templates.find(t => t.id !== editingId && t.code.toUpperCase() === trimmedCode);
    const duplicateNameObj = templates.find(t => t.id !== editingId && t.name.toLowerCase() === trimmedName.toLowerCase());
    const duplicateInEntries = entries.find(e => e.code && e.code.toUpperCase() === trimmedCode);
    const duplicateInGoals = goals.find(g => g.code && g.code.toUpperCase() === trimmedCode);

    // Fallback block error messages if they force try to click save
    if (duplicateCodeObj) {
      setError(`Code "${trimmedCode}" is already in use by activity: ${duplicateCodeObj.name}`);
      return;
    }

    if (duplicateInGoals) {
      setError(`Code "${trimmedCode}" is already used by a goal: ${duplicateInGoals.name}`);
      return;
    }

    if (duplicateInEntries) {
      setError(`Code "${trimmedCode}" is already present in diary entries.`);
      return;
    }

    if (duplicateNameObj) {
      setError(`Activity name "${trimmedName}" already exists.`);
      return;
    }

    const template: ActivityTemplate = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      code: trimmedCode,
      name: trimmedName,
      points: points === '' ? 0 : points,
    };

    if (editingId) {
      setIsUpdating(true);
      
      // Artificial delay to showcase the loading state in red box
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update from everywhere (entries database)
      const oldTemplate = templates.find(t => t.id === editingId);
      if (oldTemplate) {
        const oldCode = oldTemplate.code;
        try {
          const db = await getDB();
          const allEntries = await db.getAll('entries');
          const entriesToUpdate = allEntries.filter((e: any) => e.code.toUpperCase() === oldCode.toUpperCase());
          
          if (entriesToUpdate.length > 0) {
            const tx = db.transaction('entries', 'readwrite');
            for (const entry of entriesToUpdate) {
              const updated = {
                ...entry,
                code: trimmedCode,
                name: trimmedName
              };
              tx.store.put(updated);
            }
            await tx.done;
          }
        } catch (err) {
          console.error("Failed to update entries database:", err);
        }
      }
      
      onEdit(template);
    } else {
      onAdd(template);
    }
    
    reset();
  };

  const reset = () => {
    setShowForm(false);
    setEditingId(null);
    setCode('');
    setName('');
    setPoints(0);
    setError(null);
    setMatchingCount(null);
    setIsUpdating(false);
  };

  const startEdit = async (t: ActivityTemplate) => {
    setEditingId(t.id);
    setCode(t.code);
    setName(t.name);
    setPoints(t.points);
    setShowForm(true);
    setError(null);
    setMatchingCount(null);

    try {
      const db = await getDB();
      const allEntries = await db.getAll('entries');
      const count = allEntries.filter((e: any) => e.code.toUpperCase() === t.code.toUpperCase()).length;
      setMatchingCount(count);
    } catch (err) {
      console.error(err);
      setMatchingCount(0);
    }
    
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleForm = () => {
    if (showForm) {
      reset();
    } else {
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div className="space-y-6 dark:text-white text-black">

      <div className="relative flex justify-between items-center md:gap-4 md:p-4 p-1 overflow-visible">
        {/* Large Decorative Background Icon */}
        <div className="absolute top-1 -translate-y-10 -right-10 text-blue-500/20 dark:text-blue-400/15 pointer-events-none select-none z-0 transform rotate-12">
          <List size={180} strokeWidth={1.2} />
        </div>

        {/* Left Section: Icon + Headings */}
        <div className="flex items-center gap-4 relative z-10">
          {/* Upgraded List Icon Badge */}
          <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-sm shadow-blue-100/50 dark:shadow-none shrink-0 transition-transform hover:scale-105">
            <List size={24} strokeWidth={2.2} />
            {/* Subtle glow effect breaking outside the badge */}
            <span className="absolute inset-0 rounded-xl bg-blue-400/20 blur-xl -z-10 animate-pulse" />
          </div>

          <div>
            <h2 ref={formRef} className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Manage Activities
            </h2>
            <p className="text-[10px] md:text-xs font-bold opacity-60 dark:opacity-50 text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Configure your point system
            </p>
          </div>
        </div>

        {/* Right Section: Premium Action Button */}
        <button
          onClick={toggleForm}
          className={`flex items-center gap-2 text-white px-4 py-3 rounded-xl font-semibold text-sm tracking-wide shadow-md transition-all duration-300 transform active:scale-95 shrink-0 select-none ${
            showForm 
              ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30'
          }`}
        >
          <span className={`transform transition-transform duration-300 ${showForm ? 'rotate-90' : 'rotate-0'}`}>
            {!showForm ? <Plus size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
          </span>
          <span className="hidden sm:inline-block font-bold">
            {showForm ? 'Cancel' : 'New Activity'}
          </span>
        </button>
      </div>

      {/* --- SEARCH BAR SECTION --- */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search by activity name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white outline-none font-bold text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
      </div>
      {/* ------------------------- */}

{showForm && (
  <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 md:p-6 p-3 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
    <div className="grid grid-cols-1 md:grid-cols-4 md:gap-4 gap-2">
      
      {/* ACTIVITY NAME INPUT */}
      <div className="space-y-1 md:col-span-2">
        <label className={`text-[10px] font-black uppercase px-1 transition-colors flex items-center gap-1 ${isDuplicateName ? 'text-red-500' : 'text-gray-500 dark:text-slate-400'}`}>
          Activity Name {isDuplicateName && '(Already Exists)'}
        </label>
        <div className="relative flex items-center">
          {/* ICON POSITIONED ON THE LEFT */}
          <Zap size={16} className={`absolute left-3 pointer-events-none ${isDuplicateName ? 'text-red-500' : 'text-blue-500'}`} />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Title"
            disabled={isUpdating}
            /* CHANGED pl-4 pr-10 TO pl-9 pr-4 to accommodate the left-aligned icon */
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border outline-none text-sm font-bold dark:bg-slate-900 dark:text-white transition-all ${
              isDuplicateName 
                ? 'border-red-500 ring-4 ring-red-500/10 focus:border-red-500' 
                : 'border-gray-200 dark:border-slate-700 focus:border-blue-500'
            }`}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:col-span-2">
        {/* CODE INPUT */}
        <div className="space-y-1">
          <label className={`text-[10px] font-black uppercase px-1 transition-colors flex items-center gap-1 ${isDuplicateCode ? 'text-red-500' : 'text-gray-500 dark:text-slate-400'}`}>
            Code {isDuplicateCode && '(In Use)'}
          </label>
          <div className="relative flex items-center">
            {/* ICON POSITIONED ON THE LEFT */}
            <Code size={16} className={`absolute left-3 pointer-events-none ${isDuplicateCode ? 'text-red-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="XYZ"
              disabled={isUpdating}
              /* CHANGED pl-4 pr-10 TO pl-9 pr-4 */
              className={`w-full uppercase pl-9 pr-4 py-2.5 rounded-xl border outline-none text-sm font-bold dark:bg-slate-900 dark:text-white transition-all ${
                isDuplicateCode 
                  ? 'border-red-500 ring-4 ring-red-500/10 focus:border-red-500' 
                  : 'border-gray-200 dark:border-slate-700 focus:border-blue-500'
              }`}
              required
            />
          </div>
        </div>

        {/* DEFAULT POINTS INPUT */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-400 px-1 flex items-center gap-1">
            Default Points
          </label>
          <div className="relative flex items-center">
            {/* ICON POSITIONED ON THE LEFT */}
            <Star size={16} className="absolute left-3 text-amber-500 pointer-events-none" />
            <input
              type="number"
              value={points === '' ? '' : points}
              onChange={e => setPoints(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              disabled={isUpdating}
              /* CHANGED pl-4 pr-10 TO pl-9 pr-4 */
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none text-sm font-bold focus:border-blue-500 transition-colors"
              required
            />
          </div>
        </div>
      </div>
    </div>

    {/* Form Submit Button Line */}
    <div className="flex items-end md:col-span-4">
      <button 
        type="submit" 
        disabled={isUpdating}
        className={`w-full py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-colors uppercase text-xs tracking-widest ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {editingId ? 'Update' : 'Save'}
      </button>
    </div>

    {/* Notification & Async Alerts */}
    {!isUpdating && editingId && matchingCount === null && (
      <div className="flex items-center gap-2.5 text-blue-500 text-xs font-bold bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
        <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
        <span>Fetching matching history records count...</span>
      </div>
    )}

    {!isUpdating && editingId && matchingCount !== null && (
      <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 text-xs font-bold bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
        <Zap size={14} className="text-blue-500 shrink-0 animate-pulse" />
        <span>Total {matchingCount} records found. If updated, all of them will be renamed.</span>
      </div>
    )}

    {isUpdating && (
      <div className="flex items-center gap-2.5 text-emerald-500 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
        <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
        <span>Updating total of {matchingCount !== null ? matchingCount : 0} activity from records...</span>
      </div>
    )}

    {error && (
      <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
        <AlertCircle size={14} />
        {error}
      </div>
    )}
  </form>
)}

      <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-gray-100 dark:divide-slate-700">
          {sortedTemplates.map(t => (
            <div key={t.id} className="px-4 py-3.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Zap size={13} className="text-blue-400 shrink-0" />
                    <span className="font-bold text-[15px] text-gray-900 dark:text-white truncate">{t.name}</span>
                  </div>
                  <span className="font-black text-blue-500 text-sm shrink-0">{t.points >= 0 ? `+${t.points}` : t.points}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md uppercase tracking-wider text-[10px] border border-blue-500/20">{t.code}</span>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-0.5">
                <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={16}/></button>
                <button onClick={() => onDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {sortedTemplates.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">
              {searchTerm ? "No activities match your search." : 'No activities configured. Click "New Activity" to start.'}
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-gray-50 dark:bg-slate-900/50">
              <tr>
                <th className="pl-5 pr-3 py-3 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 w-24">Code</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500">Activity</th>
                <th className="px-3 py-3 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 w-20 text-center">Pts</th>
                <th className="pl-3 pr-5 py-3 text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {sortedTemplates.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="pl-5 pr-3 py-3.5">
                    <span className="font-black text-blue-500 bg-blue-50 dark:bg-blue-900/20 whitespace-nowrap px-2.5 py-1 rounded-md uppercase tracking-wider text-xs border border-blue-500/20">{t.code}</span>
                  </td>
                  <td className="px-3 py-3.5">
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Zap size={13} className="text-blue-400 shrink-0" />
                      {t.name}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <span className="font-black text-blue-500 text-base">{t.points >= 0 ? `+${t.points}` : t.points}</span>
                  </td>
                  <td className="pl-3 pr-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => onDelete(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedTemplates.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-slate-500 italic">
                    {searchTerm ? "No activities match your search." : 'No activities configured. Click "New Activity" to start.'}
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

export default ActivitiesView;