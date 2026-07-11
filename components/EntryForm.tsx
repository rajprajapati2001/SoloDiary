import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ActivityEntry, ActivityTemplate, Goal } from '../types';
import { X, NotebookTabs, Save, Banknote, Clock, Zap, Target, FileText, Calendar as CalendarIcon, Link as LinkIcon, ChevronDown, Code, Star, ArrowDownLeft, ArrowUpRight, NotebookPen, Activity, KeySquare } from 'lucide-react';
import { useReducedMotion, motion, AnimatePresence } from 'motion/react';
import { CURRENCY_MAP } from '../constants';

interface EntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ActivityEntry) => void | Promise<void>;
  initialData?: ActivityEntry | null;
  templates: ActivityTemplate[];
  goals: Goal[];
  disableDates?: boolean;
  title?: string;
  icon?: React.ReactNode;
}

type SuggestionItem = {
  type: 'activity' | 'goal';
  code: string;
  name: string;
  points: number;
};

const SuggestionList = React.memo(({ list, onSelect }: { list: SuggestionItem[]; onSelect: (s: SuggestionItem) => void }) => (
  <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
    {list.map((s, idx) => (
      <button
        key={`${s.type}-${s.code}-${idx}`}
        type="button"
        onClick={() => onSelect(s)}
        className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-slate-700/50 flex items-center justify-between group transition-colors border-b border-gray-50 dark:border-slate-700/30 last:border-0"
      >
        <div className="flex items-center gap-2">
          {s.type === 'activity' ? <Zap size={14} className="text-blue-500" /> : <Target size={14} className="text-emerald-500" />}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-black dark:text-white leading-tight">{s.name}</span>
            <span className="text-[9px] font-black uppercase opacity-40 text-black dark:text-white tracking-wider">Ref: {s.code}</span>
          </div>
        </div>
        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">+{s.points}p</span>
      </button>
    ))}
  </div>
));

const getNowDefaults = () => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTime = now.toTimeString().slice(0, 5);
  return { today, currentTime };
};

const EntryForm: React.FC<EntryFormProps> = ({ isOpen, onClose, onSave, initialData, templates, goals, disableDates, title, icon }) => {
  const shouldReduceMotion = useReducedMotion();
  const nowDefaults = useMemo(() => getNowDefaults(), []);
  const [shouldRender, setShouldRender] = useState(false);
  const [isBodyReady, setIsBodyReady] = useState(false);
  const [isHeavyUiReady, setIsHeavyUiReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLongEvent, setIsLongEvent] = useState(initialData?.isLongEvent ?? false);
  const [isCashTransaction, setIsCashTransaction] = useState(!!(initialData?.debit || initialData?.credit));
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(!!(initialData?.description || initialData?.attachment));

  const [fromDate, setFromDate] = useState(initialData?.fromDate ?? nowDefaults.today);
  const [fromTime, setFromTime] = useState(initialData?.fromTime ?? nowDefaults.currentTime);
  const [toDate, setToDate] = useState(initialData?.toDate ?? (isLongEvent ? nowDefaults.today : ''));
  const [toTime, setToTime] = useState(initialData?.toTime ?? (isLongEvent ? nowDefaults.currentTime : ''));
  const [code, setCode] = useState(initialData?.code ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [points, setPoints] = useState(initialData?.points ?? 0);
  const [debit, setDebit] = useState(initialData?.debit ?? 0);
  const [credit, setCredit] = useState(initialData?.credit ?? 0);
  const [moneyCode, setMoneyCode] = useState(initialData?.moneyCode ?? (localStorage.getItem('solo_diary_default_currency') || 'INR'));
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [attachment, setAttachment] = useState(initialData?.attachment ?? '');

  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState('');

  const nameSuggestionRef = useRef<HTMLDivElement>(null);
  const codeSuggestionRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // --- Animation Logic ---
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsBodyReady(true);
      setIsHeavyUiReady(true);
      setIsVisible(true);
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(true);
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let frame: number | null = null;
    let closeTimer: number | null = null;

    if (isOpen) {
      setIsClosing(false);
      setIsVisible(false);
      frame = window.requestAnimationFrame(() => setIsVisible(true));
    }

    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      if (closeTimer !== null) window.clearTimeout(closeTimer);
    };
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (!isOpen) {
      setIsBodyReady(false);
      return;
    }
    const timer = window.setTimeout(() => setIsBodyReady(true), shouldReduceMotion ? 0 : 110);
    return () => window.clearTimeout(timer);
  }, [isOpen, shouldReduceMotion]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;

    setIsHeavyUiReady(false);

    const warmHeavyUi = () => {
      if (!cancelled) setIsHeavyUiReady(true);
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(warmHeavyUi, { timeout: 180 });
    } else {
      timeoutId = window.setTimeout(warmHeavyUi, 120);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isOpen]);

  // --- Reset Form on Open ---
  useEffect(() => {
    if (!isOpen) return;

    const { today, currentTime } = getNowDefaults();
    const nextLongEvent = initialData?.isLongEvent ?? false;

    setIsSubmitting(false);
    setIsLongEvent(nextLongEvent);
    setIsCashTransaction(!!(initialData?.debit || initialData?.credit));
    setIsDescriptionOpen(!!(initialData?.description || initialData?.attachment));
    setFromDate(initialData?.fromDate ?? today);
    setFromTime(initialData?.fromTime ?? currentTime);
    setToDate(initialData?.toDate ?? (nextLongEvent ? today : ''));
    setToTime(initialData?.toTime ?? (nextLongEvent ? currentTime : ''));
    setCode(initialData?.code ?? '');
    setName(initialData?.name ?? '');
    setPoints(initialData?.points ?? 0);
    setDebit(initialData?.debit ?? 0);
    setCredit(initialData?.credit ?? 0);
    setMoneyCode(initialData?.moneyCode ?? (localStorage.getItem('solo_diary_default_currency') || 'INR'));
    setDescription(initialData?.description ?? '');
    setAttachment(initialData?.attachment ?? '');
    setSelectedTemplateId('');
    setSelectedGoalId('');
    setShowNameSuggestions(false);
    setShowCodeSuggestions(false);
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialData) {
      if (!fromDate) setFromDate(nowDefaults.today);
      if (!fromTime) setFromTime(nowDefaults.currentTime);
      if (isLongEvent) {
        if (!toDate) setToDate(nowDefaults.today);
        if (!toTime) setToTime(nowDefaults.currentTime);
      }
    }
  }, [isOpen, isLongEvent, initialData, fromDate, fromTime, toDate, toTime, nowDefaults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameSuggestionRef.current && !nameSuggestionRef.current.contains(event.target as Node)) {
        setShowNameSuggestions(false);
      }
      if (codeSuggestionRef.current && !codeSuggestionRef.current.contains(event.target as Node)) {
        setShowCodeSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDescriptionOpen || !descriptionRef.current || !isBodyReady) return;

    const adjustHeight = () => {
      const textarea = descriptionRef.current;
      if (!textarea) return;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    adjustHeight();
    const frameId = window.requestAnimationFrame(adjustHeight);
    return () => window.cancelAnimationFrame(frameId);
  }, [description, isDescriptionOpen, isBodyReady, initialData]);

  // --- Memoized Data ---
  const activeGoals = useMemo(() => (isHeavyUiReady ? goals.filter(g => !g.achievedAt) : []), [goals, isHeavyUiReady]);
  const templateSearchIndex = useMemo(
    () => (isHeavyUiReady ? templates.map(t => ({ ...t, lowerName: t.name.toLowerCase(), lowerCode: t.code.toLowerCase() })) : []),
    [templates, isHeavyUiReady]
  );
  const goalSearchIndex = useMemo(
    () => (isHeavyUiReady ? activeGoals.map(g => ({ ...g, lowerName: g.name.toLowerCase(), lowerCode: g.code.toLowerCase() })) : []),
    [activeGoals, isHeavyUiReady]
  );
  const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId), [templates, selectedTemplateId]);
  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId), [goals, selectedGoalId]);

  const nameSuggestions = useMemo(() => {
    if (!showNameSuggestions || !name.trim()) return [];
    const search = name.toLowerCase();
    const templateMatches = templateSearchIndex
      .filter(t => t.lowerName.includes(search))
      .map(t => ({ type: 'activity' as const, code: t.code, name: t.name, points: t.points }));
    const goalMatches = goalSearchIndex
      .filter(g => g.lowerName.includes(search))
      .map(g => ({ type: 'goal' as const, code: g.code, name: g.name, points: g.points }));
    return [...templateMatches, ...goalMatches].slice(0, 8);
  }, [name, showNameSuggestions, templateSearchIndex, goalSearchIndex]);

  const codeSuggestions = useMemo(() => {
    if (!showCodeSuggestions || !code.trim()) return [];
    const search = code.toLowerCase();
    const templateMatches = templateSearchIndex
      .filter(t => t.lowerCode.includes(search))
      .map(t => ({ type: 'activity' as const, code: t.code, name: t.name, points: t.points }));
    const goalMatches = goalSearchIndex
      .filter(g => g.lowerCode.includes(search))
      .map(g => ({ type: 'goal' as const, code: g.code, name: g.name, points: g.points }));
    return [...templateMatches, ...goalMatches].slice(0, 8);
  }, [code, showCodeSuggestions, templateSearchIndex, goalSearchIndex]);

  // --- Handlers ---
  const handleSelectSuggestion = useCallback((s: SuggestionItem) => {
    setCode(s.code);
    setName(s.name);
    setPoints(s.points);
    setShowNameSuggestions(false);
    setShowCodeSuggestions(false);
  }, []);

  const handleSelectTemplate = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const template = templates.find(t => t.id === val);
    if (template) {
      setCode(template.code);
      setName(template.name);
      setPoints(template.points);
    }
  }, [templates]);

  const handleCloseWithAnimation = () => {
    if (isClosing || isSubmitting) return;
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isClosing || isSubmitting) return;

    setIsSubmitting(true);
    setIsClosing(true);
    setIsVisible(false);

    const payload: ActivityEntry = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      isLongEvent,
      fromDate,
      fromTime,
      toDate: isLongEvent ? toDate : null,
      toTime: isLongEvent ? toTime : null,
      code,
      name,
      points,
      debit: isCashTransaction ? debit : 0,
      credit: isCashTransaction ? credit : 0,
      moneyCode: isCashTransaction ? moneyCode : undefined,
      description: isDescriptionOpen ? description : '',
      attachment: isDescriptionOpen ? attachment : '',
      createdAt: initialData?.createdAt || Date.now(),
    };

    window.setTimeout(async () => {
      await Promise.resolve(onSave(payload));
    }, 160);
  };

  const formatMobileDate = (dateString: string) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    }).replace(/ /g, ' ');
  };

  // --- Render ---
  if (!shouldRender) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseWithAnimation}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[1px] cursor-pointer"
          />

          {/* Modal */}
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
            className={`fixed inset-0 z-[101] flex items-center justify-center md:p-4 p-2 pointer-events-none`}
          >
<div
  className={`bg-white dark:bg-slate-900 w-full max-w-lg md:rounded-[2.5rem] rounded-[1.5rem] shadow-xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 dark:border-white/10 pointer-events-auto`}
>
  {/* Header */}
  <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
    <div className="flex items-center gap-3">
      {icon || (title?.toLowerCase().includes('key') || title?.toLowerCase().includes('auto') ? (
        <KeySquare size={25} className="text-emerald-500 dark:text-emerald-400" />
      ) : (
        <NotebookTabs size={25} className="text-blue-500 dark:text-blue-400" />
      ))}
      <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">
        {title || (initialData ? 'Edit Event Record' : 'Add Event Details')}
      </h2>
    </div>
    <button
      disabled={isClosing || isSubmitting}
      onClick={handleCloseWithAnimation}
      className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <X size={24} />
    </button>
  </div>

  {/* Body */}
  {isBodyReady ? (
    <form onSubmit={handleSubmit} className="md:pl-6 md:pr-6 p-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-4">
      {/* Top Toggles Row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setIsLongEvent(!isLongEvent)}
          className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold transition-all border-2 ${
            isLongEvent
              ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-400'
              : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-white/10 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Clock size={18} />
          <span className="hidden md:inline text-xs uppercase">2nd Time</span>
          <span className="md:hidden text-xs uppercase">Time</span>
        </button>

        <button
          type="button"
          onClick={() => setIsCashTransaction(!isCashTransaction)}
          className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold transition-all border-2 ${
            isCashTransaction
              ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-400'
              : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-white/10 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <Banknote size={18} />
          <span className="hidden md:inline text-xs uppercase">Cash Details</span>
          <span className="md:hidden text-xs uppercase">Cash</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
          className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold transition-all border-2 ${
            isDescriptionOpen
              ? 'bg-pink-50 border-pink-500 text-pink-600 dark:bg-pink-950/40 dark:border-pink-500 dark:text-pink-400'
              : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-white/10 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          <FileText size={18} />
          <span className="hidden md:inline text-xs uppercase">Description</span>
          <span className="md:hidden text-xs uppercase">Notes</span>
        </button>
      </div>

      {/* Row 2: Primary Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        {/* FROM DATE */}
        {!disableDates && (
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-70 flex items-center gap-1 text-black dark:text-white">
              <CalendarIcon size={12} className="text-blue-500" /> {isLongEvent ? "From Date" : "Date"}
            </label>
            <div className="relative flex items-center">
              {/* Mobile Overlay */}
              <div className="absolute inset-0 md:hidden flex items-center w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-slate-800 dark:border-white/10 pointer-events-none z-10 bg-white dark:bg-slate-900 justify-between">
                <span className="text-black dark:text-white font-bold text-sm">
                  {formatMobileDate(fromDate)}
                </span>
                <CalendarIcon size={16} className="text-blue-500" />
              </div>

              {/* Input */}
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold opacity-0 md:opacity-100 cursor-pointer focus:border-blue-500 dark:focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* FROM TIME */}
        <div className={`space-y-1 relative ${disableDates ? 'col-span-2' : ''}`}>
          <label className="text-[10px] font-black uppercase opacity-70 flex items-center gap-1 text-black dark:text-white">
            <Clock size={12} className="text-emerald-500" /> {isLongEvent ? "From Time" : "Time"}
          </label>
          <div className="relative">
            <input
              type="time"
              value={fromTime}
              onChange={e => setFromTime(e.target.value)}
              required
              className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold text-[15px] focus:border-blue-500 dark:focus:border-blue-500 transition-all"
            />
            <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Row 3: Conditional End Date & Time */}
      {isLongEvent && (
        <div className="grid grid-cols-2 gap-4 overflow-hidden">
          {/* TO DATE */}
          {!disableDates && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase opacity-70 flex items-center gap-1 text-black dark:text-white">
                <CalendarIcon size={12} className="text-blue-500" /> To Date
              </label>
              <div className="relative flex items-center">
                {/* Mobile Overlay */}
                <div className="absolute inset-0 md:hidden flex items-center w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-slate-800 dark:border-white/10 pointer-events-none z-10 bg-white dark:bg-slate-900 justify-between">
                  <span className="text-black dark:text-white font-bold text-sm">
                    {formatMobileDate(toDate)}
                  </span>
                  <CalendarIcon size={16} className="text-blue-500" />
                </div>

                {/* Input */}
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold opacity-0 md:opacity-100 cursor-pointer focus:border-blue-500 dark:focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* TO TIME */}
          <div className={`space-y-1 ${disableDates ? 'col-span-2' : ''}`}>
            <label className="text-[10px] font-black uppercase opacity-70 flex items-center gap-1 text-black dark:text-white">
              <Clock size={12} className="text-emerald-500" /> To Time
            </label>
            <div className="relative">
              <input
                type="time"
                value={toTime}
                onChange={e => setToTime(e.target.value)}
                required
                className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold text-[15px] focus:border-blue-500 dark:focus:border-blue-500 transition-all"
              />
              <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Quick Select Panel */}
      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800 w-full shadow-sm">
        {/* Activities Selector */}
        <div className="flex-1 relative flex items-center justify-between gap-1 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700/50 transition-all group cursor-pointer overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
            <Activity size={14} className="text-blue-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200 font-bold text-[11px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {isHeavyUiReady ? (selectedTemplate?.name || "Activities") : "Loading Activities..."}
            </span>
          </div>
          <ChevronDown size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0 pointer-events-none" />

          <select
            value={selectedTemplateId}
            disabled={!isHeavyUiReady}
            onChange={(e) => {
              setSelectedTemplateId(e.target.value);
              handleSelectTemplate(e);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
          >
            <option value="" className="overflow-auto no-scrollbar dark:bg-slate-900 px-2 text-slate-400">{isHeavyUiReady ? 'Activities' : 'Loading...'}</option>
            {isHeavyUiReady && templates.map(t => (
              <option key={t.id} value={t.id} className="dark:bg-slate-900 px-2 text-slate-200">
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vertical Divider */}
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 shrink-0"></div>

        {/* Goals Selector */}
        <div className="flex-1 relative flex items-center justify-between gap-1 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700/50 transition-all group cursor-pointer overflow-hidden">
          <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
            <Target size={14} className="text-emerald-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200 font-bold text-[11px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {isHeavyUiReady ? (selectedGoal?.name || "Goals List") : "Loading Goals..."}
            </span>
          </div>
          <ChevronDown size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0 pointer-events-none" />

          <select
            value={selectedGoalId}
            disabled={!isHeavyUiReady}
            onChange={(e) => {
              const g = goals.find(x => x.id === e.target.value);
              if (g) {
                setSelectedGoalId(g.id);
                setCode(g.code);
                setName(g.name);
                setPoints(g.points);
              } else {
                setSelectedGoalId("");
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
          >
            <option value="" className="dark:bg-slate-900 px-2 text-slate-400">{isHeavyUiReady ? 'Goals List' : 'Loading...'}</option>
            {isHeavyUiReady && activeGoals.map(g => (
              <option key={g.id} value={g.id} className="dark:bg-slate-900 px-2 text-slate-200">
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 5: Activity Name */}
      <div className="space-y-1 relative" ref={nameSuggestionRef}>
        <label className="text-[10px] inline-flex gap-1 font-black uppercase opacity-70 text-black dark:text-white"> <Zap size={12} className="text-amber-500" /> Activity Name </label>
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setShowNameSuggestions(true); }}
          onFocus={() => setShowNameSuggestions(true)}
          placeholder="Title"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white font-bold outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all"
          required
        />
        {showNameSuggestions && nameSuggestions.length > 0 && (
          <SuggestionList list={nameSuggestions} onSelect={handleSelectSuggestion} />
        )}
      </div>

      {/* Row 6: Code | Points */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1 relative" ref={codeSuggestionRef}>
          <label className="inline-flex gap-1 text-[10px] font-black uppercase opacity-70 text-black dark:text-white"> <Code size={12} className="text-slate-400" />Code</label>
          <input
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setShowCodeSuggestions(true); }}
            onFocus={() => setShowCodeSuggestions(true)}
            placeholder="XYZ"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white font-bold outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all"
            required
          />
          {showCodeSuggestions && codeSuggestions.length > 0 && (
            <SuggestionList list={codeSuggestions} onSelect={handleSelectSuggestion} />
          )}
        </div>
        <div className="space-y-1">
          <label className="text-[10px] inline-flex gap-1 font-black uppercase opacity-70 text-black dark:text-white"><Star size={12} className="text-amber-500" />Points</label>
          <input
            type="number"
            value={points || ""}
            onChange={e => setPoints(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="0"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white font-bold outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all"
            required
          />
        </div>
      </div>

      {/* Row 7: Debit | Credit (Conditional) */}
      {isCashTransaction && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 overflow-hidden">
            <div className="space-y-1">
              <label className="inline-flex gap-1 text-[10px] font-black text-red-500 uppercase"><ArrowDownLeft size={12} /> Debit ({CURRENCY_MAP[moneyCode]?.symbol ?? '₹'})</label>
              <input
                type="number"
                min="0"
                value={debit || ""}
                onChange={e => setDebit(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 text-red-600 font-bold bg-red-50 dark:bg-red-500/10 outline-none focus:border-red-500 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="inline-flex gap-1 text-[10px] font-black text-emerald-500 uppercase"><ArrowUpRight size={12} /> Credit ({CURRENCY_MAP[moneyCode]?.symbol ?? '₹'})</label>
              <input
                type="number"
                min="0"
                value={credit || ""}
                onChange={e => setCredit(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-500/10 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] inline-flex gap-1 font-black uppercase opacity-70 text-black dark:text-white">
              <Banknote size={12} className="text-emerald-500" /> Currency DEFAULT SELECTOR
            </label>
            <select
              value={moneyCode}
              onChange={e => {
                const selected = e.target.value;
                setMoneyCode(selected);
                localStorage.setItem('solo_diary_default_currency', selected);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 dark:bg-slate-800 text-black dark:text-white font-bold cursor-pointer outline-none focus:border-emerald-500 transition-all"
            >
              {Object.entries(CURRENCY_MAP)
                .sort((a, b) => a[1].country.localeCompare(b[1].country))
                .map(([code, { symbol, country }]) => (
                  <option
                    key={code}
                    value={code}
                    className="dark:bg-slate-900 text-black dark:text-white"
                  >
                    {country} - {code} ({symbol})
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Row 8 & 9: Description & Attachment (Conditional) */}
      {isDescriptionOpen && (
        <div className="space-y-4 overflow-hidden">
          <div className="space-y-1">
            <label className="inline-flex gap-1 text-[10px] font-black uppercase opacity-70 text-black dark:text-white"><NotebookPen size={12} className="text-pink-500"/>Activity Notes...</label>
            <textarea
              ref={descriptionRef}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell your story..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white text-sm resize-none overflow-hidden outline-none focus:border-pink-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase opacity-70 flex items-center gap-1 text-black dark:text-white">
              <LinkIcon size={12} className="text-blue-500" /> Attachment
            </label>
            <input
              type="url"
              value={attachment}
              onChange={e => setAttachment(e.target.value)}
              placeholder="https:// ..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white text-sm outline-none focus:border-pink-500 transition-all"
            />
          </div>
        </div>
      )}

      {/* Footer Actions */}
<div className="flex gap-3 pt-6">
  <button
    type="button"
    disabled={isClosing || isSubmitting}
    onClick={handleCloseWithAnimation}
    className="flex-1 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 dark:from-red-700 dark:to-rose-700 dark:hover:from-red-600 dark:hover:to-rose-600 text-white font-black rounded-2xl shadow-md active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed"
  >
    Cancel
  </button>
  <button
    type="submit"
    disabled={isClosing || isSubmitting}
    className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-700 dark:to-teal-700 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white font-black rounded-2xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed"
  >
    <Save size={20} /> Save Record
  </button>
</div>
    </form>
  ) : (
    <div className="md:pl-6 md:pr-6 p-4 space-y-3">
      <div className="h-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
      <div className="h-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
      <div className="h-10 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
      <div className="h-36 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
    </div>
  )}
</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default EntryForm;