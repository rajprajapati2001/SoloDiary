import React, { useState, useEffect } from 'react';
import { KeySquare, Trash2, Edit2, CalendarSync, Check, GripVertical, Search } from 'lucide-react';
import { AutoTemplate, ActivityEntry, ActivityTemplate, Goal } from '../types';
import { getDB } from '../db';
import EntryForm from './EntryForm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AutoFillProps {
  onAddEntries: (entries: ActivityEntry[]) => void;
  templates: ActivityTemplate[];
  goals: Goal[];
  entries: ActivityEntry[];
}

interface SortableItemProps {
  t: AutoTemplate;
  toggleTemplate: (t: AutoTemplate) => void;
  onEdit: (t: AutoTemplate) => void;
  onDelete: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ t, toggleTemplate, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: t.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group p-4 rounded-3xl border transition-all ${
        t.isEnabled
          ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm'
          : 'bg-gray-50 dark:bg-slate-950 border-transparent opacity-60'
      } ${isDragging ? 'shadow-2xl ring-2 ring-blue-500/50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={20} />
        </button>

        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-lg shrink-0">
          {t.code}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-black text-gray-800 dark:text-white uppercase tracking-tight truncate">
            {t.name}
          </h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {t.isLongEvent ? `${t.fromTime} - ${t.toTime}` : t.toTime}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(t)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(t.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <input
            type="checkbox"
            checked={t.isEnabled}
            onChange={() => toggleTemplate(t)}
            className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-blue-600 transition-all cursor-pointer ml-1"
          />
        </div>
      </div>

      {(t.description || t.points > 0) && (
        <div className="mt-3 pl-12 space-y-2">
          {t.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-1">
              {t.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
              +{t.points} pts
            </span>
            {t.debit! > 0 && (
              <span className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase">
                -{t.debit}₹
              </span>
            )}
            {t.credit! > 0 && (
              <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                +{t.credit}₹
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AutoFill: React.FC<AutoFillProps> = ({ onAddEntries, templates: activityTemplates, goals, entries }) => {
  const [templates, setTemplates] = useState<AutoTemplate[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutoTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const db = await getDB();
    const data = await db.getAll('auto_templates');
    const sorted = (data as AutoTemplate[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setTemplates(sorted);
  };

  // Filter templates based on search
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      isEnabled: editingTemplate?.isEnabled ?? true,
      order: editingTemplate?.order ?? templates.length
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

    const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = templates.findIndex((t) => t.id === active.id);
      const newIndex = templates.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(templates, oldIndex, newIndex).map((t: AutoTemplate, idx: number) => ({
        ...t,
        order: idx,
      }));

      setTemplates(newOrder);

      const db = await getDB();
      const tx = db.transaction('auto_templates', 'readwrite');
      await Promise.all(newOrder.map((t) => tx.store.put(t)));
      await tx.done;
    }
  };

  const handleAutoFill = () => {
    const enabledTemplates = templates.filter(t => t.isEnabled);
    if (enabledTemplates.length === 0) {
      alert('No enabled automation keys found.');
      return;
    }

    if (!window.confirm(`Add ${enabledTemplates.length} records to today's diary?`)) return;

    const today = new Date().toISOString().split('T')[0];
    const alreadyFilled = entries.some(e => e.toDate === today);

    if (alreadyFilled && !window.confirm('Records for today already exist. Add again?')) return;
    if (!window.confirm(`Add ${enabledTemplates.length} records to today?`)) return;

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
    alert('Added successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center md:gap-4 gap-2 bg-white dark:bg-slate-900 md:p-6 p-3 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm">
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
          <button onClick={handleAutoFill} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs">
            <Check size={18} /> Run AutoFill
          </button>
          <button onClick={() => { setEditingTemplate(null); setIsFormOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">
            <KeySquare size={18} /> New Key
          </button>
        </div>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="relative group mx-2">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        <input 
          type="text"
          placeholder="Search by name, code or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 dark:text-white text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SortableContext items={filteredTemplates.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {filteredTemplates.map((t) => (
              <SortableItem
                key={t.id}
                t={t}
                toggleTemplate={toggleTemplate}
                onEdit={(t) => { setEditingTemplate(t); setIsFormOpen(true); }}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {(templates.length === 0 || (filteredTemplates.length === 0 && searchTerm)) && !isFormOpen && (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            {searchTerm ? <Search size={32} /> : <CalendarSync size={32} />}
          </div>
          <h3 className="text-lg font-black text-gray-400 uppercase tracking-tighter">
            {searchTerm ? "No results found" : "No Automation Keys"}
          </h3>
          <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mt-1">
            {searchTerm ? "Try adjusting your search term" : "Create keys to speed up your logging"}
          </p>
        </div>
      )}

      {isFormOpen && (
        <EntryForm
          title={editingTemplate ? 'Edit Auto Key' : 'New Auto Key'}
          onClose={() => { setIsFormOpen(false); setEditingTemplate(null); }}
          onSave={handleSaveTemplate}
          templates={activityTemplates}
          goals={goals}
          disableDates={true}
          initialData={editingTemplate ? {
            ...editingTemplate,
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
