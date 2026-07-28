import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KeySquare, Trash2, Edit2, CalendarSync, Check, GripVertical, SquareCheckBig, Square, MinusSquare, Search, Paperclip, Plus, X, FolderKanban, Play, FolderPlus, Key } from 'lucide-react';
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
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'motion/react';

interface AutoFillProps {
  onAddEntries: (entries: ActivityEntry[]) => void;
  templates: ActivityTemplate[];
  goals: Goal[];
  entries: ActivityEntry[];
}

interface AutoTab {
  id: string;
  isTab: boolean;
  name: string;
  order: number;
}

interface SortableTabItemProps {
  tab: AutoTab;
  isActive: boolean;
  tabCount: number;
  isEditing: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
  editingTabName: string;
  setEditingTabName: (val: string) => void;
}

const SortableTabItem: React.FC<SortableTabItemProps> = ({
  tab,
  isActive,
  tabCount,
  isEditing,
  onSelect,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onDelete,
  editingTabName,
  setEditingTabName,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        if (isEditing) return;
        onSelect();
      }}
      className={`group flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 select-none cursor-pointer w-full sm:w-auto ${
        isActive
          ? 'bg-gradient-to-r from-violet-500/15 to-indigo-500/15 border-violet-500 text-violet-750 dark:text-violet-300 font-black shadow-md shadow-violet-100/30 dark:shadow-none'
          : 'bg-slate-50 dark:bg-slate-900/40 border-gray-100 dark:border-slate-800/80 text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-gray-750 dark:hover:text-slate-300'
      } ${isDragging ? 'shadow-xl ring-2 ring-violet-500/40 opacity-80' : ''}`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
        title="Drag to reorder tab"
      >
        <GripVertical size={13} />
      </button>

      {isEditing ? (
        <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editingTabName}
            onChange={(e) => setEditingTabName(e.target.value)}
            className="px-2 py-1 text-xs font-bold border border-violet-500 rounded-lg bg-white dark:bg-slate-950 outline-none text-gray-800 dark:text-white flex-1 min-w-[80px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveRename();
              else if (e.key === 'Escape') onCancelRename();
            }}
          />
          <button
            onClick={onSaveRename}
            className="p-1 bg-emerald-500/80 text-white rounded-md hover:bg-emerald-600 transition-colors"
          >
            <Check size={12} />
          </button>
          <button
            onClick={onCancelRename}
            className="p-1 bg-red-500/80 text-white rounded-md hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <span className="text-[12px] font-mono bg-slate-250/60 dark:bg-slate-800 px-2 py-0.5 rounded-md text-violet-400 dark:text-violet-500 font-bold shrink-0">
            {tabCount}
          </span>
          <span className="text-xs uppercase tracking-wider truncate mr-auto">
            {tab.name}
          </span>
        </div>
      )}

      {/* Action buttons (Rename & Delete) on Hover / Mobile visible */}
      {!isEditing && (
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onStartRename(); }}
            className="p-1 text-gray-400 hover:text-violet-500 hover:bg-violet-500/15 rounded-md transition-all"
            title="Rename Tab"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-500/15 rounded-md transition-all"
            title="Delete Tab & Activities"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

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
      className={`group px-4 py-4 rounded-3xl border transition-all duration-200 ${
        t.isEnabled
          ? 'bg-white dark:bg-slate-900 border-gray-150/80 dark:border-slate-800/80 shadow-md shadow-gray-100/30 dark:shadow-none'
          : 'bg-gray-50/70 dark:bg-slate-950/40 border-transparent opacity-60'
      } ${isDragging ? 'shadow-2xl ring-2 ring-violet-500/50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-450 cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical size={16} />
        </button>

        <div className="w-9 h-9 rounded-xl bg-violet-600 dark:bg-violet-500/90 flex items-center justify-center text-white font-black text-xs shadow-sm shrink-0 uppercase tracking-tight">
          {t.code}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-gray-800 dark:text-white truncate leading-tight">
            {t.name}
          </h4>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-wide mt-0.5">
            {t.isLongEvent ? `${t.fromTime} – ${t.toTime}` : t.fromTime || t.toTime}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(t)}
            className="p-1.5 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-colors"
            title="Edit Activity Key"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(t.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
            title="Delete Activity Key"
          >
            <Trash2 size={14} />
          </button>
          <div className="relative flex items-center ml-1">
            <input
              type="checkbox"
              className="w-5 h-5 rounded-lg border-2 border-gray-200 dark:border-slate-800 checked:bg-violet-600 transition-all cursor-pointer appearance-none checked:border-violet-600"
              checked={t.isEnabled}
              onChange={() => toggleTemplate(t)}
            />
            {t.isEnabled && <Check size={13} className="absolute left-[3.5px] text-white pointer-events-none" />}
          </div>
        </div>
      </div>

      {(t.description || t.points !== 0 || (t.debit && t.debit !== 0) || (t.credit && t.credit !== 0) || t.attachment) && (
        <div className="mt-3 ml-11 flex flex-wrap items-center gap-1.5">
          {t.description && (
            <p className="text-[11px] text-gray-455 dark:text-gray-500 italic line-clamp-2 mr-1 basis-full mb-1">
              {t.description}
            </p>
          )}
          
          {/* Points Display */}
          {t.points !== 0 && (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
              t.points > 0 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100/30' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100/30'
            }`}>
              {t.points > 0 ? `+${t.points}` : t.points} pts
            </span>
          )}

          {/* Debit Display */}
          {t.debit !== undefined && t.debit !== 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-100/30">
              -{Math.abs(t.debit)}{getCurrencySymbol(t.moneyCode)}
            </span>
          )}

          {/* Credit Display */}
          {t.credit !== undefined && t.credit !== 0 && (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-100/30">
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
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-200/30 transition-colors"
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

const generateShortId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const AutoFill: React.FC<AutoFillProps> = ({ onAddEntries, templates: activityTemplates, goals, entries }) => {
  const [tabs, setTabs] = useState<AutoTab[]>([]);
  const [templates, setTemplates] = useState<AutoTemplate[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  
  // Popup management states
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupTabId, setPopupTabId] = useState<string | null>(null);

  // Modals / Inputs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AutoTemplate | null>(null);
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
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
    
    // Separate tabs and keys
    const fetchedTabs = (data.filter((item: any) => item.isTab === true) as AutoTab[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const fetchedTemplates = (data.filter((item: any) => !item.isTab) as AutoTemplate[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (fetchedTabs.length === 0) {
      // Create General default tab
      const defaultTab: AutoTab = {
        id: 'default-tab',
        isTab: true,
        name: 'General',
        order: 0,
      };
      
      const tx = db.transaction('auto_templates', 'readwrite');
      await tx.store.put(defaultTab);
      
      // Migrate legacy keys to the general tab
      const migratedTemplates = fetchedTemplates.map((t, idx) => ({
        ...t,
        tabId: 'default-tab',
        order: idx,
      }));
      
      await Promise.all(migratedTemplates.map(t => tx.store.put(t)));
      await tx.done;
      
      setTabs([defaultTab]);
      setTemplates(migratedTemplates);
      setActiveTabId('default-tab');
    } else {
      setTabs(fetchedTabs);
      
      // Ensure all templates have a valid tabId
      const firstTabId = fetchedTabs[0].id;
      let needsSaving = false;
      const sanitizedTemplates = fetchedTemplates.map((t, idx) => {
        if (!t.tabId || !fetchedTabs.some(tb => tb.id === t.tabId)) {
          needsSaving = true;
          return { ...t, tabId: firstTabId, order: t.order ?? idx };
        }
        return t;
      });

      if (needsSaving) {
        const tx = db.transaction('auto_templates', 'readwrite');
        await Promise.all(sanitizedTemplates.map(t => tx.store.put(t)));
        await tx.done;
      }

      setTemplates(sanitizedTemplates);
      
      // Set active tab fallback
      if (!activeTabId || !fetchedTabs.some(tb => tb.id === activeTabId)) {
        setActiveTabId(firstTabId);
      }
    }
  };

  // Tab management actions
  const handleAddTab = async () => {
    if (!newTabName.trim()) return;
    const db = await getDB();
    const newTab: AutoTab = {
      isTab: true,
      name: newTabName.trim(),
      order: tabs.length,
    };
    const newTabId = await db.put('auto_templates', newTab);
    setIsAddingTab(false);
    setNewTabName('');
    await fetchTemplates();
    setActiveTabId(newTabId as string);
  };

  const handleRenameTab = async () => {
    if (!editingTabId || !editingTabName.trim()) return;
    const db = await getDB();
    const existing = tabs.find(t => t.id === editingTabId);
    if (existing) {
      const updated = { ...existing, name: editingTabName.trim() };
      await db.put('auto_templates', updated);
    }
    setEditingTabId(null);
    setEditingTabName('');
    await fetchTemplates();
  };

  const handleDeleteTab = async (tabId: string) => {
    const targetTab = tabs.find(t => t.id === tabId);
    if (!targetTab) return;
    if (tabs.length <= 1) {
      alert("At least one Automation tab must exist!");
      return;
    }
    if (!window.confirm(`Delete tab "${targetTab.name}" and ALL its inside activity keys? This cannot be undone.`)) return;

    const db = await getDB();
    // Delete tab
    await db.delete('auto_templates', tabId);
    // Delete all keys inside this tab
    const keysToDelete = templates.filter(t => (t as any).tabId === tabId);
    await Promise.all(keysToDelete.map(k => db.delete('auto_templates', k.id)));

    // Set fallback active tab
    const remainingTabs = tabs.filter(t => t.id !== tabId);
    const fallbackTabId = remainingTabs[0]?.id || '';
    setActiveTabId(fallbackTabId);
    if (popupTabId === tabId) {
      setIsPopupOpen(false);
      setPopupTabId(null);
    }
    await fetchTemplates();
  };

  // Key operations
  const handleSaveTemplate = async (entry: ActivityEntry) => {
    const db = await getDB();
    const targetTabId = popupTabId || activeTabId || tabs[0]?.id || 'default-tab';
    
    const template: AutoTemplate & { tabId: string } = {
      ...(editingTemplate?.id ? { id: editingTemplate.id } : {}),
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
      moneyCode: entry.moneyCode,
      isEnabled: editingTemplate?.isEnabled ?? true,
      order: editingTemplate?.order ?? templates.filter(t => (t as any).tabId === targetTabId).length,
      tabId: (editingTemplate as any)?.tabId || targetTabId,
    };

    await db.put('auto_templates', template);
    setIsFormOpen(false);
    setEditingTemplate(null);
    await fetchTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('Delete this automation key?')) return;
    const db = await getDB();
    await db.delete('auto_templates', id);
    await fetchTemplates();
  };

  const toggleTemplate = async (template: AutoTemplate) => {
    const db = await getDB();
    const updated = { ...template, isEnabled: !template.isEnabled };
    await db.put('auto_templates', updated);
    await fetchTemplates();
  };

  // Filtering activities inside selected active/popup tab
  const tabTemplates = templates.filter(t => (t as any).tabId === (popupTabId || activeTabId));
  const filteredTabTemplates = tabTemplates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabAllSelected = tabTemplates.length > 0 && tabTemplates.every(t => t.isEnabled);
  const tabSomeSelected = tabTemplates.some(t => t.isEnabled) && !tabAllSelected;

  const handleToggleAllInTab = async (enable: boolean) => {
    const db = await getDB();
    const tx = db.transaction('auto_templates', 'readwrite');
    const targetTabId = popupTabId || activeTabId;
    const updatedTemplates = templates.map(t => {
      if ((t as any).tabId === targetTabId) {
        return { ...t, isEnabled: enable };
      }
      return t;
    });
    await Promise.all(updatedTemplates.map(t => tx.store.put(t)));
    await tx.done;
    await fetchTemplates();
  };

  // Reordering tabs (using rectSortingStrategy for wrapped horizontal layout)
  const handleTabDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((t) => t.id === active.id);
      const newIndex = tabs.findIndex((t) => t.id === over.id);

      const newOrder = arrayMove(tabs, oldIndex, newIndex).map((t, idx) => ({
        ...t,
        order: idx,
      }));

      setTabs(newOrder);

      const db = await getDB();
      const tx = db.transaction('auto_templates', 'readwrite');
      await Promise.all(newOrder.map((t) => tx.store.put(t)));
      await tx.done;
    }
  };

  // Reordering activities within a tab
  const handleActivityDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const targetTabId = popupTabId || activeTabId;
      const currentTabKeys = templates.filter(t => (t as any).tabId === targetTabId);
      const otherTabKeys = templates.filter(t => (t as any).tabId !== targetTabId);

      const oldIndex = currentTabKeys.findIndex((t) => t.id === active.id);
      const newIndex = currentTabKeys.findIndex((t) => t.id === over.id);

      const reorderedCurrent = arrayMove(currentTabKeys, oldIndex, newIndex).map((t, idx) => ({
        ...t,
        order: idx,
      }));

      const finalTemplates = [...otherTabKeys, ...reorderedCurrent];
      setTemplates(finalTemplates);

      const db = await getDB();
      const tx = db.transaction('auto_templates', 'readwrite');
      await Promise.all(reorderedCurrent.map((t) => tx.store.put(t)));
      await tx.done;
    }
  };

  const handleRunTabAutofill = () => {
    const targetTabId = popupTabId || activeTabId;
    const currentTabKeys = templates.filter(t => (t as any).tabId === targetTabId);
    const enabledTemplates = currentTabKeys.filter(t => t.isEnabled);
    
    if (enabledTemplates.length === 0) {
      alert('No enabled automation keys found in this tab.');
      return;
    }

    if (!window.confirm(`Add ${enabledTemplates.length} records to today's diary?`)) return;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const alreadyFilled = entries.some(e => (e.fromDate || e.toDate) === today);

    if (alreadyFilled && !window.confirm('Records for today already exist. Add again?')) return;

    const newEntries: ActivityEntry[] = enabledTemplates.map(t => ({
      id: generateShortId(),
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
      moneyCode: t.moneyCode,
      createdAt: Date.now(),
    }));

    onAddEntries(newEntries);
    setIsPopupOpen(false);
    alert('Added successfully!');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:p-4 p-1 overflow-visible">
        {/* Large Decorative Background Icon */}
        <div className="absolute top-1 -translate-y-10 -right-10 text-violet-500/10 dark:text-violet-400/10 pointer-events-none select-none z-0 transform rotate-12">
          <CalendarSync size={180} strokeWidth={1.2} />
        </div>

        {/* Left Section: Icon Badge + Headings */}
        <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
          <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 shadow-sm shadow-violet-100/50 dark:shadow-none shrink-0 transition-transform hover:scale-105">
            <CalendarSync size={24} strokeWidth={2.2} />
            <span className="absolute inset-0 rounded-xl bg-violet-400/20 blur-xl -z-10 animate-pulse" />
          </div>

          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              AutoFill Engine
            </h2>
            <p className="text-[10px] md:text-xs font-bold opacity-60 dark:opacity-50 text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Manual automation for daily logs
            </p>
          </div>
        </div>
      </div>

      {/* Tab Management Bar (Layout Section) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-150/80 dark:border-slate-850 p-5 rounded-[2rem] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-50 dark:border-slate-850/60">

          {/* Add Tab Trigger */}
          {!isAddingTab ? (
            <>          
          <div className="flex items-center gap-2">
            <FolderKanban className="text-violet-500" size={22} />
            <div className="text-left">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 leading-none">
                Automation Tabs
              </h4>
            </div>
          </div>
          

            <button
              onClick={() => { setIsAddingTab(true); setNewTabName(''); }}
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-755 dark:text-violet-400 dark:hover:text-violet-300 transition-colors bg-violet-50 dark:bg-violet-950/40 px-3 py-1.5 rounded-xl border border-violet-100 dark:border-violet-900/40"
            >
              <FolderPlus size={22} />
              <span>Add Tab</span>
            </button>
            </>
          ) : (
<div className="flex items-center gap-1.5 w-full sm:w-auto">
  <input
    type="text"
    placeholder="New Tab name..."
    value={newTabName}
    onChange={(e) => setNewTabName(e.target.value)}
    className="flex-1 sm:flex-initial px-2.5 py-2 text-xs font-bold border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-950 outline-none focus:border-violet-500 transition-all dark:text-white"
    autoFocus
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleAddTab();
      else if (e.key === 'Escape') setIsAddingTab(false);
    }}
  />
  <button
    onClick={handleAddTab}
    className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shrink-0"
    title="Save Tab"
  >
    <Check size={14} />
  </button>
  <button
    onClick={() => setIsAddingTab(false)}
    className="p-1.5 bg-red-200 dark:bg-red-800 text-white rounded-lg hover:bg-red-300 dark:hover:bg-red-700 transition-colors shrink-0"
    title="Cancel"
  >
    <X size={14} />
  </button>
</div>
          )}
        </div>

        {/* Tab Pills row (with rectSortingStrategy for wrapping flex row layout) */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTabDragEnd}>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 items-stretch sm:items-center w-full">
            <SortableContext items={tabs.map(t => t.id)} strategy={rectSortingStrategy}>
              {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                const tabCount = templates.filter(t => (t as any).tabId === tab.id).length;
                const isEditing = editingTabId === tab.id;

                return (
                  <SortableTabItem
                    key={tab.id}
                    tab={tab}
                    isActive={isActive}
                    tabCount={tabCount}
                    isEditing={isEditing}
                    onSelect={() => {
                      setActiveTabId(tab.id);
                      setPopupTabId(tab.id);
                      setSearchTerm('');
                      setIsPopupOpen(true);
                    }}
                    onStartRename={() => {
                      setEditingTabId(tab.id);
                      setEditingTabName(tab.name);
                    }}
                    onSaveRename={handleRenameTab}
                    onCancelRename={() => setEditingTabId(null)}
                    onDelete={() => handleDeleteTab(tab.id)}
                    editingTabName={editingTabName}
                    setEditingTabName={setEditingTabName}
                  />
                );
              })}
            </SortableContext>
          </div>
        </DndContext>
      </div>

      {/* Popup Dialog View containing activities inside selected tab */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isPopupOpen && popupTabId && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsPopupOpen(false)}
                className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-[1px] cursor-pointer"
              />

              {/* Dialog Wrapper */}
              <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 280,
                    damping: 26,
                  }
                }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-[151] flex items-center justify-center md:p-4 p-2 pointer-events-none"
              >
                {/* Dialog Body */}
                <div
                  className="bg-white dark:bg-slate-900 border border-gray-150/80 dark:border-slate-800/85 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative z-10 pointer-events-auto"
                >
                  {/* Active Tab Header Bar */}
                  <div className="p-6 pb-4 border-b border-gray-100 dark:border-slate-850/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-650 dark:text-violet-400 rounded-2xl border border-violet-100 dark:border-violet-900/50 shadow-sm shrink-0">
                        <FolderKanban size={20} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-base font-black uppercase tracking-tight text-gray-900 dark:text-white leading-none">
                          {tabs.find(t => t.id === popupTabId)?.name || 'General'}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-1.5">
                          {tabTemplates.length} keys in this automation tab
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsPopupOpen(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>

{/* Search & Bulk Select row */}
<div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-950/30 border-b border-gray-100 dark:border-slate-800/60 flex items-center justify-between gap-3">
  {/* Search (left side) */}
  <div className="relative flex-1 sm:flex-initial sm:max-w-xs">
    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
    <input
      type="text"
      placeholder="Search keys..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2 text-xs font-bold border border-gray-200 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 outline-none focus:border-violet-500 transition-all dark:text-white"
    />
  </div>

  {/* Select All Checkbox (right side) */}
  {tabTemplates.length > 0 && (
    <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 group">
      <div className="relative flex items-center justify-center w-5 h-5">
        {/* Hidden native input, handles behavior only */}
        <input
          type="checkbox"
          className="sr-only" 
          checked={tabAllSelected}
          ref={el => {
            if (el) el.indeterminate = tabSomeSelected;
          }}
          onChange={(e) => handleToggleAllInTab(e.target.checked)}
        />
        
        {/* State 1: All Selected */}
        {tabAllSelected && !tabSomeSelected && (
          <SquareCheckBig size={20} className="text-violet-600 dark:text-violet-400 transition-transform scale-100 group-hover:scale-105" />
        )}

        {/* State 2: Some Selected (Indeterminate) */}
        {tabSomeSelected && (
          <MinusSquare size={20} className="text-violet-500 dark:text-violet-400 transition-transform scale-100 group-hover:scale-105" />
        )}

        {/* State 3: None Selected */}
        {!tabAllSelected && !tabSomeSelected && (
          <Square size={20} className="text-gray-400 dark:text-slate-500 transition-colors group-hover:text-violet-500 dark:group-hover:text-violet-400" />
        )}
      </div>
      
        {/* Hidden text on mobile view ('hidden sm:inline') */}
        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
          {tabAllSelected ? 'Deselect All' : 'Select All'}
        </span>
    </label>
  )}
</div>

                  {/* Scrollable list of keys */}
                  <div className="flex-1 overflow-y-auto md:p-6 p-2 space-y-3">
                    {filteredTabTemplates.length > 0 ? (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleActivityDragEnd}>
                        <div className="space-y-3">
                          <SortableContext items={filteredTabTemplates.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            {filteredTabTemplates.map((t) => (
                              <SortableItem
                                key={t.id}
                                t={t}
                                toggleTemplate={toggleTemplate}
                                onEdit={(item) => {
                                  setEditingTemplate(item);
                                  setIsFormOpen(true);
                                }}
                                onDelete={handleDeleteTemplate}
                              />
                            ))}
                          </SortableContext>
                        </div>
                      </DndContext>
                    ) : (
                      <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-950/20 rounded-[2rem] border-2 border-dashed border-gray-150 dark:border-slate-800">
                        <CalendarSync size={24} className="mx-auto text-gray-300 dark:text-slate-700 mb-3" />
                        <p className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 leading-none">
                          {searchTerm ? "No matching results" : "This tab is empty"}
                        </p>
                        <p className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase tracking-widest mt-2">
                          {searchTerm ? "Try adjusting your search criteria" : "Click 'Add Key' below to create activities"}
                        </p>
                      </div>
                    )}
                  </div>

{/* Footer actions inside the popup */}
<div className="p-5 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:justify-between bg-slate-50/50 dark:bg-slate-950/20">
  <button
    onClick={() => {
      setEditingTemplate(null);
      setIsFormOpen(true);
    }}
    className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 hover:shadow-lg hover:scale-[1.01] active:scale-95flex items-center justify-center gap-1.5 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 dark:from-violet-600 dark:to-indigo-700 dark:hover:from-violet-500 dark:hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-violet-500/10 hover:shadow-lg hover:scale-[1.01] active:scale-95"
  >
    <KeySquare size={14} strokeWidth={2.5} />
    <span>Add Key</span>
  </button>

  <button
    onClick={handleRunTabAutofill}
    disabled={tabTemplates.filter(t => t.isEnabled).length === 0}
    className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/10 hover:shadow-lg hover:scale-[1.01] active:scale-95"
  >
    <Play size={14} fill="currentColor" />
    <span>Run Autofill</span>
  </button>
</div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* EntryForm for adding or editing an automation key */}
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
            moneyCode: editingTemplate.moneyCode,
            createdAt: Date.now()
          } : null}
        />
      )}
    </div>
  );
};

export default AutoFill;