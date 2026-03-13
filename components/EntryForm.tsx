
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ActivityEntry, ActivityTemplate, Goal } from '../types';
import { X, NotebookTabs, Save, Banknote, Clock, Zap, Target, FileText, Calendar as CalendarIcon, Link as LinkIcon, ChevronDown, Code, Star, ArrowDownLeft, ArrowUpRight, NotebookPen, Activity,KeySquare } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface EntryFormProps {
  onClose: () => void;
  onSave: (entry: ActivityEntry) => void | Promise<void>;
  initialData?: ActivityEntry | null;
  templates: ActivityTemplate[];
  goals: Goal[];
  disableDates?: boolean;
  title?: string;
  icon?: React.ReactNode;
}

const EntryForm: React.FC<EntryFormProps> = ({ onClose, onSave, initialData, templates, goals, disableDates, title, icon }) => {
  const shouldReduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLongEvent, setIsLongEvent] = useState(initialData?.isLongEvent ?? false);
  const [isCashTransaction, setIsCashTransaction] = useState(!!(initialData?.debit || initialData?.credit));
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(!!(initialData?.description || initialData?.attachment));
  
  const [fromDate, setFromDate] = useState(initialData?.fromDate ?? '');
  const [fromTime, setFromTime] = useState(initialData?.fromTime ?? '');
  const [toDate, setToDate] = useState(initialData?.toDate ?? '');
  const [toTime, setToTime] = useState(initialData?.toTime ?? '');
  const [code, setCode] = useState(initialData?.code ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [points, setPoints] = useState(initialData?.points ?? 0);
  const [debit, setDebit] = useState(initialData?.debit ?? 0);
  const [credit, setCredit] = useState(initialData?.credit ?? 0);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [attachment, setAttachment] = useState(initialData?.attachment ?? '');
  
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false);
  
  const nameSuggestionRef = useRef<HTMLDivElement>(null);
  const codeSuggestionRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (!initialData) {
      setToDate(today);
      setToTime(currentTime);
      if (isLongEvent) {
        setFromDate(today);
        setFromTime(currentTime);
      }
    }
  }, [isLongEvent, initialData]);

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
    if (!isDescriptionOpen || !descriptionRef.current) return;
    descriptionRef.current.style.height = 'auto';
    descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
  }, [description, isDescriptionOpen]);

  const nameSuggestions = React.useMemo(() => {
    if (!name.trim()) return [];
    const search = name.toLowerCase();
    const templateMatches = templates
      .filter(t => t.name.toLowerCase().includes(search))
      .map(t => ({ ...t, type: 'activity' as const }));
    const goalMatches = goals
      .filter(g => !g.achievedAt && g.name.toLowerCase().includes(search))
      .map(g => ({ ...g, type: 'goal' as const }));
    return [...templateMatches, ...goalMatches].slice(0, 8);
  }, [name, templates, goals]);

  const codeSuggestions = React.useMemo(() => {
    if (!code.trim()) return [];
    const search = code.toLowerCase();
    const templateMatches = templates
      .filter(t => t.code.toLowerCase().includes(search))
      .map(t => ({ ...t, type: 'activity' as const }));
    const goalMatches = goals
      .filter(g => !g.achievedAt && g.code.toLowerCase().includes(search))
      .map(g => ({ ...g, type: 'goal' as const }));
    return [...templateMatches, ...goalMatches].slice(0, 8);
  }, [code, templates, goals]);

  const handleSelectSuggestion = (s: { code: string, name: string, points: number }) => {
    setCode(s.code);
    setName(s.name);
    setPoints(s.points);
    setShowNameSuggestions(false);
    setShowCodeSuggestions(false);
  };

  const handleSelectTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const template = templates.find(t => t.id === val);
    if (template) {
      setCode(template.code);
      setName(template.name);
      setPoints(template.points);
    }
  };

  const handleCloseWithAnimation = () => {
    if (isClosing) return;
    setIsClosing(true);
    setIsVisible(false);
    window.setTimeout(() => onClose(), 180);
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
      fromDate: isLongEvent ? fromDate : null,
      fromTime: isLongEvent ? fromTime : null,
      toDate,
      toTime,
      code,
      name,
      points,
      debit: isCashTransaction ? debit : 0,
      credit: isCashTransaction ? credit : 0,
      description: isDescriptionOpen ? description : '',
      attachment: isDescriptionOpen ? attachment : '',
      createdAt: initialData?.createdAt || Date.now(),
    };

    window.setTimeout(async () => {
      await Promise.resolve(onSave(payload));
    }, 160);
  };

  const SuggestionList = ({ list, onSelect }: { list: any[], onSelect: (s: any) => void }) => (
    <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
      {list.map((s, idx) => (
        <button
          key={idx}
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
  );

  const formatMobileDate = (dateString: string) => {
  if (!dateString) return 'Select Date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  }).replace(/ /g, ' '); // Returns "02 Feb 26"
};

  const [selectedTemplateId, setSelectedTemplateId] = useState("");
const [selectedGoalId, setSelectedGoalId] = useState("");


  const modalContent = (
<div className={`text-black dark:text-white fixed inset-0 z-[100] flex items-center justify-center md:p-4 p-2 bg-black/80 backdrop-blur-xl transition-opacity ${isClosing ? 'duration-150 ease-in' : 'duration-250 ease-out'} ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
  <div className={`bg-white dark:bg-slate-900 w-full max-w-lg md:rounded-[2.5rem] rounded-[1.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10 transform-gpu will-change-transform transition-all ${isClosing ? 'duration-150 ease-in' : 'duration-300 ease-out'} ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-[0.985]'}`}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            {icon || (title?.toLowerCase().includes('key') || title?.toLowerCase().includes('auto') ? (
              <KeySquare size={25} className="text-emerald-600" />
            ) : (
              <NotebookTabs size={25} className="text-blue-600" />
            ))}
          <h2 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">
            {title || (initialData ? 'Edit Event Record' : 'Add Event Details')}
          </h2>
          </div>
          <button disabled={isClosing || isSubmitting} onClick={handleCloseWithAnimation} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            <X size={24} className="text-black dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="md:pl-6 md:pr-6 p-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-4">
          {/* Top Toggles Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setIsLongEvent(!isLongEvent)}
              className={`flex items-center justify-center gap-1.5 py-3 rounded-2xl font-bold transition-all border-2 ${
                isLongEvent 
                ? 'bg-blue-700 border-blue-600 text-white' 
                : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-white/10 text-black dark:text-white'
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
                ? 'bg-emerald-700 border-emerald-600 text-white' 
                : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-white/10 text-black dark:text-white'
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
                ? 'bg-pink-700 border-pink-600 text-white' 
                : 'bg-gray-50 border-gray-200 dark:bg-slate-800 dark:border-white/10 text-black dark:text-white'
              }`}
            >
              <FileText size={18} />
              <span className="hidden md:inline text-xs uppercase">Description</span>
              <span className="md:hidden text-xs uppercase">Notes</span>
            </button>
          </div>

{/* Row 3: From Date | From Time (Conditional) */}
<AnimatePresence initial={false}>
{isLongEvent && (
  <motion.div
    key="long-event"
    initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -6 }}
    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
    transition={{ duration: shouldReduceMotion ? 0.12 : 0.22, ease: 'easeOut' }}
    className="grid grid-cols-2 gap-4 overflow-hidden"
  >
    {/* FROM DATE */}
{!disableDates && (
<div className="space-y-1">
  <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1 text-black dark:text-white">
    <CalendarIcon size={12} /> From Date
  </label>
  <div className="relative flex items-center">
    {/* Mobile Overlay: Text Left, Icon Right */}
    <div className="absolute inset-0 md:hidden flex items-center w-full px-4 py-2.5 rounded-xl border border-gray-200 pointer-events-none z-10">
      <span className="text-black dark:text-white font-bold text-sm">
        {formatMobileDate(fromDate)}
      </span>
      <CalendarIcon size={16} className="absolute right-4 text-blue-500" />
    </div>

    {/* Input: Hidden visually on mobile but clickable */}
    <input 
      type="date" 
      value={fromDate} 
      onChange={e => setFromDate(e.target.value)} 
      required 
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold opacity-0 md:opacity-100 cursor-pointer" 
    />
    
    {/* Desktop Icon: Always visible on PC */}
    
  </div>
</div>
)}

    {/* FROM TIME */}
    <div className={`space-y-1 ${disableDates ? 'col-span-2' : ''}`}>
      <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1 text-black dark:text-white">
        <Clock size={12} /> From Time
      </label>
      <div className="relative">
        <input 
          type="time" 
          value={fromTime} 
          onChange={e => setFromTime(e.target.value)} 
          required 
          className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold text-[15px]" 
        />
        <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
      </div>
    </div>
  </motion.div>
)}
 </AnimatePresence>

{/* Row 2: To Date | To Time */}
<div className="grid grid-cols-2 gap-4">
  {/* TO DATE */}
  {!disableDates && (
  <div className="space-y-1">
  <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1 text-black dark:text-white">
    <CalendarIcon size={12} /> To Date
  </label>
  <div className="relative flex items-center">
    {/* Mobile Overlay: Text Left, Icon Right (Hidden on PC) */}
    <div className="absolute inset-0 md:hidden flex items-center w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 pointer-events-none z-10">
      <span className="text-black dark:text-white font-bold text-sm">
        {formatMobileDate(toDate)}
      </span>
      <CalendarIcon size={16} className="absolute right-4 text-blue-500" />
    </div>

    {/* Input Field: Visible on PC, Invisible but functional on Mobile */}
    <input 
      type="date" 
      value={toDate} 
      onChange={e => setToDate(e.target.value)} 
      required 
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold opacity-0 md:opacity-100 cursor-pointer" 
    />
    
    {/* Desktop Only Icon: Right aligned inside the input area */}
    
  </div>
</div>
)}

  {/* TO TIME */}
  <div className={`space-y-1 relative ${disableDates ? 'col-span-2' : ''}`}>
    <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1 text-black dark:text-white">
      <Clock size={12}  /> To Time
    </label>
    <div className="relative">
      <input 
        type="time" 
        value={toTime} 
        onChange={e => setToTime(e.target.value)} 
        required 
        className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 outline-none text-black dark:text-white font-bold text-[15px]" 
      />
      <Clock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
    </div>
  </div>
</div>

          

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800 w-full shadow-sm">
  
  {/* Activities Selector Group */}
<div className="flex-1 relative flex items-center justify-between gap-1 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700/50 transition-all group cursor-pointer overflow-hidden">
  <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
    <Activity size={14} className="text-blue-500 shrink-0" />
    <span className="text-slate-700 dark:text-slate-200 font-bold text-[11px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
      {templates.find(t => t.id === selectedTemplateId)?.name || "Activities"}
    </span>
  </div>
  <ChevronDown size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0 pointer-events-none" />

  <select
    value={selectedTemplateId}
    onChange={(e) => {
      setSelectedTemplateId(e.target.value);
      handleSelectTemplate(e);
    }}
    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none custom-scrollbar"
  >
    <option value="" className="overflow-auto no-scrollbar dark:bg-slate-900 px-2 text-slate-400">Activities</option>
    {templates.map(t => (
      <option key={t.id} value={t.id} className="dark:bg-slate-900 px-2 text-slate-200">
        {t.name}
      </option>
    ))}
  </select>
</div>

<style jsx global>{`
  select::-webkit-scrollbar {
    display: none;
  }
  select {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>

  {/* Vertical Divider */}
  <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 shrink-0"></div>

  {/* Goals Selector Group */}
  <div className="flex-1 relative flex items-center justify-between gap-1 pl-2.5 pr-2 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700/50 transition-all group cursor-pointer overflow-hidden">
    <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
      <Target size={14} className="text-emerald-500 shrink-0" />
      <span className="text-slate-700 dark:text-slate-200 font-bold text-[11px] truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {goals.find(g => g.id === selectedGoalId)?.name || "Goals List"}
      </span>
    </div>
    <ChevronDown size={12} className="text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0 pointer-events-none" />
    
    <select 
      value={selectedGoalId}
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
      <option value="" className="dark:bg-slate-900 px-2 text-slate-400">Goals List</option>
      {goals.filter(g => !g.achievedAt).map(g => (
        <option key={g.id} value={g.id} className="dark:bg-slate-900 px-2 text-slate-200">
          {g.name}
        </option>
      ))}
    </select>
  </div>
</div>


          {/* Row 5: Activity Name */}
          <div className="space-y-1 relative" ref={nameSuggestionRef}>
            
            <label className="text-[10px] inline-flex gap-1 font-black uppercase opacity-60 text-black dark:text-white"> <Zap size={12} /> Activity Name </label>
            <input 
              type="text" 
              value={name} 
              onChange={e => { setName(e.target.value); setShowNameSuggestions(true); }} 
              onFocus={() => setShowNameSuggestions(true)}
              placeholder="Title" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white font-bold" 
              required 
            />
            {showNameSuggestions && nameSuggestions.length > 0 && (
              <SuggestionList list={nameSuggestions} onSelect={handleSelectSuggestion} />
            )}
          </div>

          {/* Row 6: Code | Points */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 relative" ref={codeSuggestionRef}>
              <label className="inline-flex gap-1 text-[10px] font-black uppercase opacity-60 text-black dark:text-white"> <Code size={12} />Code</label>
              <input 
                type="text" 
                value={code} 
                onChange={e => { setCode(e.target.value.toUpperCase()); setShowCodeSuggestions(true); }} 
                onFocus={() => setShowCodeSuggestions(true)}
                placeholder="XYZ" 
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white font-bold" 
                required 
              />
              {showCodeSuggestions && codeSuggestions.length > 0 && (
                <SuggestionList list={codeSuggestions} onSelect={handleSelectSuggestion} />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] inline-flex gap-1 font-black uppercase opacity-60 text-black dark:text-white"><Star size={12} />Points</label>
              <input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} placeholder="0" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white font-bold" required />
            </div>
          </div>

          {/* Row 7: Debit | Credit (Conditional) */}
          <AnimatePresence initial={false}>
          {isCashTransaction && (
            <motion.div
              key="cash-fields"
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -6 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.22, ease: 'easeOut' }}
              className="grid grid-cols-2 gap-4 overflow-hidden"
            >
              <div className="space-y-1">
                <label className="inline-flex gap-1 text-[10px] font-black text-red-500 uppercase"><ArrowDownLeft size={12} /> Debit ( - )</label>
                <input type="number" value={debit} onChange={e => setDebit(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-red-500/30 text-red-600 font-bold dark:bg-red-500/10" />
              </div>
              <div className="space-y-1">
                <label className="inline-flex gap-1 text-[10px] font-black text-emerald-500 uppercase"><ArrowUpRight size={12} /> Credit ( + )</label>
                <input type="number" value={credit} onChange={e => setCredit(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-600 font-bold dark:bg-emerald-500/10" />
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Row 8 & 9: Description & Attachment (Conditional) */}
          <AnimatePresence initial={false}>
          {isDescriptionOpen && (
            <motion.div
              key="description-fields"
              initial={shouldReduceMotion ? false : { opacity: 0, height: 0, y: -6 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -4 }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.22, ease: 'easeOut' }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-1">
                <label className="inline-flex gap-1 text-[10px] font-black uppercase opacity-60 text-black dark:text-white"><NotebookPen size={12}/>Activity Notes...</label>
                <textarea 
                  ref={descriptionRef}
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Tell your story..." 
                  rows={3} 
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white text-sm resize-none overflow-hidden" 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1 text-black dark:text-white">
                  <LinkIcon size={12} /> Attachment
                </label>
                <input 
                  type="url" 
                  value={attachment} 
                  onChange={e => setAttachment(e.target.value)} 
                  placeholder="https:// ..." 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-black/20 dark:border-white/10 text-black dark:text-white text-sm" 
                />
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Footer Actions - Non-floating */}
          <div className="flex gap-3 pt-6">
            <button 
              type="button" 
              disabled={isClosing || isSubmitting}
              onClick={handleCloseWithAnimation} 
              className="flex-1 py-4 bg-red-700 text-white font-black rounded-2xl shadow-lg hover:bg-red-800 active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isClosing || isSubmitting}
              className="flex-[2] py-4 bg-green-700 text-white font-black rounded-2xl shadow-lg hover:bg-green-800 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={20} /> Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EntryForm;
