
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CalendarSync, Check, X } from 'lucide-react';
import { AutoTemplate, ActivityEntry, ActivityTemplate, Goal } from '../types';
import { getDB } from '../db';
import EntryForm from './EntryForm';

interface AutoFillProps {
  onAddEntries: (entries: ActivityEntry[]) => void;
  templates: ActivityTemplate[];
  goals: Goal[];
}

const AutoFill: React.FC<AutoFillProps> = ({ onAddEntries, templates: activityTemplates, goals }) => {
  const [templates, setTemplates] = useState<AutoTemplate[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutoTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const db = await getDB();
    const data = await db.getAll('auto_templates');
    setTemplates(data as AutoTemplate[]);
  };

  const handleSaveTemplate = async (entry: ActivityEntry) => {
    const db = await getDB();
    const template: AutoTemplate = {
      id: editingTemplate?.id || crypto.randomUUID(),
      isLongEvent: entry.isLongEvent,
      fromTime: entry.fromTime,
      toTime: entry.toTime,
      code: entry.code,
      name: entry.name,
      points: entry.points,
      description: entry.description,
      attachment: entry.attachment,
      debit: entry.debit,
      credit: entry.credit,
      isEnabled: editingTemplate?.isEnabled ?? true
    };

    await db.put('auto_templates', template);
    setIsFormOpen(false);
    setEditingTemplate(null);
    fetchTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this automation key?')) return;
    const db = await getDB();
    await db.delete('auto_templates', id);
    fetchTemplates();
  };

  const toggleTemplate = async (template: AutoTemplate) => {
    const db = await getDB();
    const updated = { ...template, isEnabled: !template.isEnabled };
    await db.put('auto_templates', updated);
    fetchTemplates();
  };

  const handleAutoFill = () => {
    const enabledTemplates = templates.filter(t => t.isEnabled);
    if (enabledTemplates.length === 0) {
      alert('No enabled automation keys found.');
      return;
    }

    if (!window.confirm(`Add ${enabledTemplates.length} records to today's diary?`)) return;

    const today = new Date().toISOString().split('T')[0];
    const newEntries: ActivityEntry[] = enabledTemplates.map(t => ({
      id: crypto.randomUUID(),
      isLongEvent: t.isLongEvent,
      fromDate: t.isLongEvent ? today : null,
      fromTime: t.fromTime,
      toDate: today,
      toTime: t.toTime,
      code: t.code,
      name: t.name,
      points: t.points,
      description: t.description,
      attachment: t.attachment,
      debit: t.debit,
      credit: t.credit,
      createdAt: Date.now()
    }));

    onAddEntries(newEntries);
    alert('Records added successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
            <CalendarSync size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter dark:text-white">AutoFill Engine</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Manual automation for daily logs</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAutoFill}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs"
          >
            <Check size={18} /> Run AutoFill
          </button>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest text-xs"
          >
            <Plus size={18} /> New Key
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className={`group p-5 rounded-3xl border transition-all ${t.isEnabled ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm' : 'bg-gray-50 dark:bg-slate-950 border-transparent opacity-60'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg">
                  {t.code}
                </div>
                <div>
                  <h4 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">{t.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {t.isLongEvent ? `${t.fromTime} - ${t.toTime}` : t.toTime}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={t.isEnabled}
                onChange={() => toggleTemplate(t)}
                className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-blue-600 transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-2 mb-4">
              {t.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">{t.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">+{t.points} pts</span>
                {t.debit! > 0 && <span className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase">-{t.debit}₹</span>}
                {t.credit! > 0 && <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">+{t.credit}₹</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-50 dark:border-slate-800">
              <button
                onClick={() => {
                  setEditingTemplate(t);
                  setIsFormOpen(true);
                }}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDeleteTemplate(t.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !isFormOpen && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <CalendarSync size={32} />
          </div>
          <h3 className="text-lg font-black text-gray-400 uppercase tracking-tighter">No Automation Keys</h3>
          <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mt-1">Create keys to speed up your logging</p>
        </div>
      )}

      {isFormOpen && (
        <EntryForm
          onClose={() => {
            setIsFormOpen(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveTemplate}
          templates={activityTemplates}
          goals={goals}
          disableDates={true}
          initialData={editingTemplate ? {
            id: editingTemplate.id,
            isLongEvent: editingTemplate.isLongEvent,
            fromDate: null,
            fromTime: editingTemplate.fromTime || '',
            toDate: '',
            toTime: editingTemplate.toTime,
            code: editingTemplate.code,
            name: editingTemplate.name,
            points: editingTemplate.points,
            description: editingTemplate.description,
            attachment: editingTemplate.attachment,
            debit: editingTemplate.debit,
            credit: editingTemplate.credit,
            createdAt: Date.now()
          } : null}
        />
      )}
    </div>
  );
};

export default AutoFill;
