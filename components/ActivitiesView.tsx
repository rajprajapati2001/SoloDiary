import React, { useState, useRef } from 'react';
import { ActivityTemplate } from '../types';
import { X, Plus, Trash2, Edit2, Zap, AlertCircle, Search } from 'lucide-react'; // Added Search icon

interface ActivitiesViewProps {
  templates: ActivityTemplate[];
  onAdd: (t: ActivityTemplate) => void;
  onEdit: (t: ActivityTemplate) => void;
  onDelete: (id: string) => void;
}

const ActivitiesView: React.FC<ActivitiesViewProps> = ({ templates, onAdd, onEdit, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [points, setPoints] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // New Search State

  const formRef = useRef<HTMLDivElement>(null);

  // Filter and then sort
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedTemplates = [...filteredTemplates].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    const duplicateCode = templates.find(t => t.id !== editingId && t.code.toUpperCase() === trimmedCode);
    const duplicateName = templates.find(t => t.id !== editingId && t.name.toLowerCase() === trimmedName.toLowerCase());

    if (duplicateCode) {
      setError(`Code "${trimmedCode}" is already in use by activity: ${duplicateCode.name}`);
      return;
    }

    if (duplicateName) {
      setError(`Activity name "${trimmedName}" already exists.`);
      return;
    }

    const template: ActivityTemplate = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      code: trimmedCode,
      name: trimmedName,
      points,
    };

    if (editingId) onEdit(template);
    else onAdd(template);
    reset();
  };

  const reset = () => {
    setShowForm(false);
    setEditingId(null);
    setCode('');
    setName('');
    setPoints(0);
    setError(null);
  };

  const startEdit = (t: ActivityTemplate) => {
    setEditingId(t.id);
    setCode(t.code);
    setName(t.name);
    setPoints(t.points);
    setShowForm(true);
    setError(null);
    
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
      <div className="flex justify-between items-center">
        <div>
          <h2 ref={formRef} className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Manage Activities</h2>
          <p className="text-xs font-bold opacity-50 dark:opacity-40 text-gray-600 dark:text-slate-400 uppercase tracking-widest mt-1">Configure your point system</p>
        </div>
        <button
          onClick={toggleForm}
          className={`flex items-center gap-2 text-white px-3 py-2 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform relative overflow-hidden ${
            showForm ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {!showForm ? <Plus size={18} /> : <X size={18} />}
          <span className="hidden md:inline-block">
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
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-400 px-1">Activity Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Title"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none text-sm font-bold focus:border-blue-500 transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-400 px-1">Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="XYZ"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none text-sm font-bold focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 dark:text-slate-400 px-1">Default Points</label>
                <input
                  type="number"
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none text-sm font-bold focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-end md:col-span-4">
            <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-colors uppercase text-xs tracking-widest">
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>

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
                  <span className="font-black text-blue-500 text-sm shrink-0">+{t.points}</span>
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
                    <span className="font-black text-blue-500 text-base">+{t.points}</span>
                  </td>
                  <td className="pl-3 pr-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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