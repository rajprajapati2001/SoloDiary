import React, { useState, useEffect } from 'react';
import { KeySquare, Trash2, Edit2, CalendarSync, Check, GripVertical, Search, Paperclip } from 'lucide-react';
import { AutoTemplate, ActivityEntry, ActivityTemplate, Goal } from '../types';
import { getDB } from '../db';
import { getCurrencySymbol } from '../constants';
import EntryForm from './EntryForm';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
      className={`group px-3 py-3 rounded-2xl border transition-all ${
        t.isEnabled
          ? 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 shadow-sm'
          : 'bg-gray-50 dark:bg-slate-950 border-transparent opacity-60'
      } ${isDragging ? 'shadow-2xl ring-2 ring-blue-500/50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical size={18} />
        </button>

        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-[10px] shadow shrink-0">
          {t.code}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate leading-tight">
            {t.name}
          </h4>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wide">
            {t.isLongEvent ? `${t.fromTime} – ${t.toTime}` : t.toTime}
          </p>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onEdit(t)}
            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => onDelete(t.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
          <div className="relative flex items-center ml-0.5">
            <input
              type="checkbox"
              className="w-[18px] h-[18px] rounded-md border-2 border-gray-200 checked:bg-blue-600 transition-all cursor-pointer appearance-none checked:border-blue-600"
              checked={t.isEnabled}
              onChange={() => toggleTemplate(t)}
            />
            {t.isEnabled && <Check size={12} className="absolute left-[3px] text-white pointer-events-none" />}
          </div>
        </div>
      </div>

      {(t.description || t.points !== 0 || (t.debit && t.debit !== 0) || (t.credit && t.credit !== 0) || t.attachment) && (
        <div className="mt-2 ml-[42px] flex flex-wrap items-center gap-1.5">
          {t.description && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 italic line-clamp-1 mr-1 basis-full">
              {t.description}
            </p>
          )}
          
          {/* Points Display */}
          {t.points !== 0 && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              t.points > 0 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}>
              {t.points > 0 ? `+${t.points}` : t.points} pts
            </span>
          )}

          {/* Debit Display */}
          {t.debit !== undefined && t.debit !== 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold">
              -{Math.abs(t.debit)}{getCurrencySymbol(t.moneyCode)}
            </span>
          )}

          {/* Credit Display */}
          {t.credit !== undefined && t.credit !== 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              +{Math.abs(t.credit)}{getCurrencySymbol(t.moneyCode)}
            </span>
          )}

          {/* Clickable Attachment Badge */}
          {t.attachment && (
            <a
              href={t.attachment}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-200/30 transition-colors"
            >
              <Paperclip size={10} strokeWidth={2.5} />
              <span>Attachment</span>
            </a>
          )}
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
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

  const handleToggleAll = async (enable: boolean) => {
    const db = await getDB();
    const tx = db.transaction('auto_templates', 'readwrite');
    const updatedTemplates = templates.map(t => ({ ...t, isEnabled: enable }));
    await Promise.all(updatedTemplates.map(t => tx.store.put(t)));
    await tx.done;
    fetchTemplates();
  };

  const allSelected = templates.length > 0 && templates.every(t => t.isEnabled);
  const someSelected = templates.some(t => t.isEnabled) && !allSelected;

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

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const alreadyFilled = entries.some(e => (e.fromDate || e.toDate) === today);

    if (alreadyFilled && !window.confirm('Records for today already exist. Add again?')) return;
    if (!window.confirm(`Add ${enabledTemplates.length} records to today?`)) return;

    const newEntries: ActivityEntry[] = enabledTemplates.map(t => ({
      id: crypto.randomUUID(),
      isLongEvent: t.isLongEvent,
      fromDate: today,
      fromTime: t.fromTime,
      toDate: t.isLongEvent ? today : null,
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
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:p-4 p-1 overflow-visible">
        {/* Large Decorative Background Icon */}
        <div className="absolute top-1 -translate-y-10 -right-10 text-violet-500/20 dark:text-violet-400/15 pointer-events-none select-none z-0 transform rotate-12">
          <CalendarSync size={180} strokeWidth={1.2} />
        </div>

        {/* Left Section: Icon Badge + Headings */}
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 shadow-sm shadow-violet-100/50 dark:shadow-none shrink-0 transition-transform hover:scale-105">
            <CalendarSync size={24} strokeWidth={2.2} />
            <span className="absolute inset-0 rounded-xl bg-violet-400/20 blur-xl -z-10 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              AutoFill Engine
            </h2>
            <p className="text-[10px] md:text-xs font-bold opacity-60 dark:opacity-50 text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Manual automation for daily logs
            </p>
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex flex-row items-center gap-2 md:gap-3 relative z-10 w-full md:w-auto no-print">
          <button 
            onClick={handleAutoFill} 
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 md:px-5 md:py-3 px-3 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 transform active:scale-95 uppercase tracking-wider text-[11px] md:text-xs select-none whitespace-nowrap"
          >
            <Check size={15} strokeWidth={2.5} /> 
            <span>Run AutoFill</span>
          </button>

          <button 
            onClick={() => { setEditingTemplate(null); setIsFormOpen(true); }} 
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 md:px-5 md:py-3 px-3 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 transform active:scale-95 uppercase tracking-wider text-[11px] md:text-xs select-none whitespace-nowrap"
          >
            <KeySquare size={15} strokeWidth={2.5} /> 
            <span>New Key</span>
          </button>
        </div>
      </div>

      {/* --- SEARCH BAR & SELECT ALL --- */}
      <div className="flex items-center gap-2 sm:gap-4 mx-2">
        <div className="relative group flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search by name, code or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white outline-none font-bold text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>
        
        {templates.length > 0 && (
          <div className="flex items-center gap-2 sm:gap-3 px-3 py-3 sm:px-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm shrink-0">
            <label className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-2 border-gray-200 checked:bg-blue-600 transition-all cursor-pointer appearance-none checked:border-blue-600"
                  checked={allSelected}
                  ref={el => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={(e) => handleToggleAll(e.target.checked)}
                />
                {allSelected && <Check size={14} className="absolute left-0.5 text-white pointer-events-none" />}
                {someSelected && <div className="absolute left-1 w-3 h-0.5 bg-gray-400 rounded-full pointer-events-none" />}
              </div>
              <span className="hidden sm:block text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 group-hover:text-blue-600 transition-colors">
                {allSelected ? 'Deselect All' : 'Select All'}
              </span>
            </label>
          </div>
        )}
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
          isOpen={isFormOpen}
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