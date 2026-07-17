import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ActivityEntry, Goal } from '../types';
import { getCurrencySymbol, getAggregateCurrencyDisplay } from '../constants';
import { Trash2, Edit2, BookText, ClockFadingIcon, CalendarRange, Clock, Paperclip, Calendar, Star, Banknote, NotebookPen, Search, ArrowUpDown, FileText, FileX, ArrowDownRight, ArrowUpRight, Zap, Trophy, Layers, TrendingUp, Coins, Captions, CaptionsOff } from 'lucide-react';
import TimeProgressBar from './TimeProgressBar'; 

interface DiaryViewProps {
  entries: ActivityEntry[];
  goals: Goal[];
  onEdit: (entry: ActivityEntry) => void;
  onDelete: (id: string) => void;
}

type ViewType = 'all' | 'transactions' | 'debit' | 'credit';

const DiaryView: React.FC<DiaryViewProps> = ({ entries, goals, onEdit, onDelete }) => {
  // Performance Optimization: Display current month only on initial load
  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Fast input state (Eliminates typing lag)
  const [searchTerm, setSearchTerm] = useState('');
  // Deferred filter state
  const [deferredSearch, setDeferredSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  // From month and To month states (Default value is current month on both sides)
  const [fromMonth, setFromMonth] = useState(currentMonth);
  const [toMonth, setToMonth] = useState(currentMonth);

  const [showProgressBar, setShowProgressBar] = useState(true);
  const [showTitleBar, setShowTitleBar] = useState(true);

  const [sortAsc, setSortAsc] = useState(false);
  const [seeAllMonths, setSeeAllMonths] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('all'); 
  const [descFilter, setDescFilter] = useState<'all' | 'with-desc' | 'no-desc'>('all');

  const [visibleMonthsCount, setVisibleMonthsCount] = useState(3);
  const [isLoadingAllMonths, setIsLoadingAllMonths] = useState(false);

  // Heavy Loaded Dataset - only updates when seeAllMonths, fromMonth, or toMonth change!
  const loadedEntries = useMemo(() => {
    return entries.filter(e => {
      const eDate = e.fromDate || e.toDate || '';
      const eMonth = eDate.substring(0, 7); // "YYYY-MM"
      if (seeAllMonths) {
        return true;
      }
      const start = fromMonth || currentMonth;
      const end = toMonth || currentMonth;
      return eMonth >= start && eMonth <= end;
    });
  }, [entries, seeAllMonths, fromMonth, toMonth, currentMonth]);

  // Handle manual From and To calendar changes with auto-update bounds constraint logic
  const handleFromMonthChange = (val: string) => {
    setFromMonth(val);
    if (toMonth && val > toMonth) {
      setToMonth(val);
    }
  };

  const handleToMonthChange = (val: string) => {
    setToMonth(val);
    if (fromMonth && val < fromMonth) {
      setFromMonth(val);
    }
  };

  // Convert month key string like "2026-07" into "Jul 26" for mobile, or full name on desktop
  const formatMonthMobile = (monthStr: string) => {
    if (!monthStr) return 'Beginning';
    try {
      const [year, month] = monthStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
      const shortYear = year.substring(2);
      return `${shortMonth} ${shortYear}`;
    } catch {
      return monthStr;
    }
  };

  const formatMonthDesktop = (monthStr: string) => {
    if (!monthStr) return 'Beginning';
    try {
      const [year, month] = monthStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const longMonth = d.toLocaleDateString('en-US', { month: 'long' });
      return `${longMonth} ${year}`;
    } catch {
      return monthStr;
    }
  };

  // Simulated premium loading transition screen for Loading All Months Records
  const handleToggleAllMonths = () => {
    if (!seeAllMonths) {
      setIsLoadingAllMonths(true);
      setTimeout(() => {
        setSeeAllMonths(true);
        setIsLoadingAllMonths(false);
      }, 750);
    } else {
      setSeeAllMonths(false);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleMonthsCount(3);
  }, [deferredSearch, fromMonth, toMonth, seeAllMonths, viewType, descFilter]);

  // Cache for formatted dates to avoid heavy Date object initialization overhead during large database loops
  const formattedDatesCache = useRef<Record<string, string>>({});
  const getFormattedDateFast = (dateStr: string) => {
    if (!dateStr) return '';
    const cached = formattedDatesCache.current[dateStr];
    if (cached) return cached;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parts[2];
        const monthName = months[monthIndex] || '';
        const formatted = `${day} ${monthName} ${year}`;
        formattedDatesCache.current[dateStr] = formatted;
        return formatted;
      }
    } catch {}
    try {
      const formatted = new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      formattedDatesCache.current[dateStr] = formatted;
      return formatted;
    } catch {
      return dateStr;
    }
  };

  // Precompute goal signatures for O(1) lightning fast lookups
  const goalKeysSet = useMemo(() => {
    const set = new Set<string>();
    for (const g of goals) {
      if (g.code && g.achievedAt) {
        set.add(`${g.code.toUpperCase()}_${g.achievedAt}`);
      }
    }
    return set;
  }, [goals]);

  const isGoalEntry = (entry: ActivityEntry) => {
    const date = entry.fromDate || entry.toDate || '';
    return goalKeysSet.has(`${entry.code.toUpperCase()}_${date}`);
  };

  const isCashEntry = (entry: ActivityEntry) => !!(entry.debit || entry.credit);

  const selectQuickMonth = (monthKey: string) => {
    setFromMonth(monthKey);
    setToMonth(monthKey);
  };

  const handleProgressBar = () => {
    setShowProgressBar(!showProgressBar);
  };

  const handleTitleBar = () => {
    setShowTitleBar(!showTitleBar);
  };

  // Debounce effect to isolate heavy dataset computing from keystrokes
  useEffect(() => {
    if (searchTerm !== deferredSearch) {
      setIsSearching(true);
    }
    const handler = setTimeout(() => {
      setDeferredSearch(searchTerm);
      setIsSearching(false);
    }, 180); // Faster reaction time for search input

    return () => clearTimeout(handler);
  }, [searchTerm, deferredSearch]);

  // Combined optimized filter, sort, and chronological database compilation
  const { chronologicalTimeline } = useMemo(() => {
    const cleanSearch = deferredSearch.toLowerCase().trim();

    // 1. Run Filters & Sorting on loadedEntries for snappier quick-action response
    const diaryEntries = loadedEntries
      .filter(e => {
        let matchesViewType = true;
        if (viewType === 'transactions') matchesViewType = isCashEntry(e);
        if (viewType === 'debit') matchesViewType = !!(e.debit && e.debit > 0);
        if (viewType === 'credit') matchesViewType = !!(e.credit && e.credit > 0);
        
        const hasDesc = e.description && e.description.trim() !== "";
        let matchesDesc = true;
        if (descFilter === 'with-desc') matchesDesc = !!hasDesc;
        if (descFilter === 'no-desc') matchesDesc = !hasDesc;

        if (!matchesViewType || !matchesDesc) return false;

        // Run absolute pool text query checking
        if (cleanSearch !== '') {
          const eDate = e.fromDate || e.toDate || '';
          const isGoal = isGoalEntry(e) ? 'goal achieved' : '';
          const formattedDate = getFormattedDateFast(eDate);
          
          const searchPool = [
            e.name, e.code, e.description || '', e.attachment || '', `${e.points} pts`,
            e.debit ? `-${e.debit} debit expense` : '', e.credit ? `+${e.credit} credit income` : '',
            e.moneyCode || '', formattedDate, isGoal
          ].join(' ').toLowerCase();

          if (!searchPool.includes(cleanSearch)) return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        const dateCompare = sortAsc 
          ? (a.fromDate || a.toDate || '').localeCompare(b.fromDate || b.toDate || '') 
          : (b.fromDate || b.toDate || '').localeCompare(a.fromDate || a.toDate || '');
        return dateCompare || (a.fromTime || a.toTime || '').localeCompare(b.fromTime || b.toTime || '');
      });

    const formatMonthNameFast = (monthKey: string) => {
      if (!monthKey) return 'Unknown Month';
      const [year, month] = monthKey.split('-');
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const idx = parseInt(month, 10) - 1;
      return `${months[idx] || ''} ${year}`;
    };

    // 2. Perform Dynamic Chronological Reduction Map
    const timeline = Object.entries(
      diaryEntries.reduce((acc, entry) => {
        const entryDate = entry.fromDate || entry.toDate || '';
        const monthKey = entryDate.substring(0, 7);
        if (!acc[monthKey]) {
          acc[monthKey] = {
            monthKey,
            monthName: formatMonthNameFast(monthKey),
            monthPoints: 0,
            monthLogsCount: 0,
            monthCredit: 0,
            monthDebit: 0,
            currencies: [],
            days: {}
          };
        }
        
        const mGroup = acc[monthKey];
        mGroup.monthPoints += entry.points;
        mGroup.monthLogsCount += 1;
        mGroup.monthCredit += entry.credit || 0;
        mGroup.monthDebit += entry.debit || 0;
        mGroup.currencies.push(entry);
        
        if (!mGroup.days[entryDate]) mGroup.days[entryDate] = [];
        mGroup.days[entryDate].push(entry);
        
        return acc;
      }, {} as Record<string, any>)
    ).map(([_, value]) => value);

    return { chronologicalTimeline: timeline };
  }, [loadedEntries, goalKeysSet, deferredSearch, sortAsc, viewType, descFilter]);

  const formatMonthKey = (key: string) => {
    if (!key) return '';
    const [year, month] = key.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(month, 10) - 1;
    return `${months[idx] || ''} ${year}`;
  };

  const monthDisplay = seeAllMonths 
    ? "All Time" 
    : (fromMonth === toMonth)
      ? `${fromMonth ? formatMonthKey(fromMonth) : 'Current Month'}`
      : `${fromMonth ? formatMonthKey(fromMonth) : 'Beginning'} to ${toMonth ? formatMonthKey(toMonth) : 'Today'}`;

  const visibleTimeline = useMemo(() => {
    return chronologicalTimeline.slice(0, visibleMonthsCount);
  }, [chronologicalTimeline, visibleMonthsCount]);

  const handleDescFilterCycle = () => {
    if (descFilter === 'all') setDescFilter('with-desc');
    else if (descFilter === 'with-desc') setDescFilter('no-desc');
    else setDescFilter('all');
  };

  const handleCashFilterCycle = () => {
    if (viewType === 'all') setViewType('transactions');
    else if (viewType === 'transactions') setViewType('debit');
    else if (viewType === 'debit') setViewType('credit');
    else setViewType('all');
  };

  return (
    <div className="space-y-6">

      {/* --- COMPACT CONSOLIDATED ROW: TITLE AND ACTION BUTTONS --- */}
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full overflow-visible md:p-4 p-1">
        
        {/* Large Decorative Background Icon */}
        <div className="absolute top-1 -translate-y-10 -right-10 text-pink-500/20 dark:text-pink-400/15 pointer-events-none select-none z-0 transform rotate-12">
          <BookText size={180} strokeWidth={1.2} />
        </div>

        {/* Left Section: Icon + Headings */}
        <div className="flex items-center gap-4 relative z-10 shrink-0 whitespace-nowrap">
          <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/50 shadow-sm shadow-pink-100/50 dark:shadow-none shrink-0 transition-transform hover:scale-105">
            <BookText size={24} strokeWidth={2.2} />
            <span className="absolute inset-0 rounded-xl bg-pink-400/20 blur-xl -z-10 animate-pulse" />
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Personal Diary
            </h2>
            <p className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
              Records for {monthDisplay}
            </p>
          </div>
        </div>

        {/* Filter Action Buttons Layout Line */}
        <div className="flex flex-wrap items-center justify-center md:justify-end w-full gap-1.5 md:gap-2 no-print z-10">

          {/* 0. PINK SEARCH TOGGLE BUTTON (Placed before All Months Toggle) */}
          <button
            onClick={() => setShowSearchBar(!showSearchBar)}
            className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg cursor-pointer ${
              showSearchBar
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 border-pink-100 dark:border-pink-900/50 hover:bg-pink-100/80 hover:border-pink-500'
            }`}
            title="Toggle Search Input"
          >
            <Search size={16} className={showSearchBar ? "text-white" : "text-pink-500"} />
            <span className="hidden md:inline">Search</span>
          </button>

          

          {/* 1. SORT BUTTON */}
          <button 
            onClick={() => setSortAsc(!sortAsc)}
            className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg cursor-pointer ${
              sortAsc 
                ? 'bg-pink-600 text-white border-pink-600' 
                : 'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-pink-500'
            }`}
            title={sortAsc ? "Showing Oldest First" : "Showing Newest First"}
          >
            <div className={`transition-transform duration-300 ${sortAsc ? 'rotate-180' : 'rotate-0'}`}>
              <ArrowUpDown size={16} className={sortAsc ? "text-white" : "text-pink-500"}/> 
            </div>
            <span className="hidden md:inline">{sortAsc ? 'Oldest' : 'Newest'}</span>
          </button>

          {/* 2. DYNAMIC CASH FILTER SELECTION TAB BUTTON */}
          <button
            onClick={handleCashFilterCycle}
            className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg cursor-pointer ${
              viewType === 'transactions' ? 'bg-amber-500 text-white border-amber-500' :
              viewType === 'debit' ? 'bg-red-500 text-white border-red-500' :
              viewType === 'credit' ? 'bg-emerald-500 text-white border-emerald-500' :
              'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-amber-500'
            }`}
            title={`Current view: ${viewType}`}
          >
            {viewType === 'all' && <Banknote size={16} className="text-amber-500" />}
            {viewType === 'transactions' && <Banknote size={16} />}
            {viewType === 'debit' && <ArrowDownRight size={16} />}
            {viewType === 'credit' && <ArrowUpRight size={16} />}
            
            <span className="hidden md:inline">
              {viewType === 'all' && 'All Logs'}
              {viewType === 'transactions' && 'Cash Only'}
              {viewType === 'debit' && 'Debits Only'}
              {viewType === 'credit' && 'Credits Only'}
            </span>
          </button>

          {/* 3. DESCRIPTION FILTER BUTTON */}
          <button
            onClick={handleDescFilterCycle}
            className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg cursor-pointer ${
              descFilter !== 'all'
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-pink-500'
            }`}
            title={descFilter === 'all' ? "Showing All Content" : descFilter === 'with-desc' ? "Showing Text Only" : "Showing Without Text"}
          >
            {descFilter === 'no-desc' ? <FileX size={16}/> : <FileText size={16} className={descFilter === 'with-desc' ? "text-white" : "text-pink-500"} />}
            <span className="hidden md:inline">
              {descFilter === 'all' && 'All Text'}
              {descFilter === 'with-desc' && 'With Description'}
              {descFilter === 'no-desc' && 'No Description'}
            </span>
          </button>

          {/* 4. ALL MONTHS TOGGLE BUTTON */}
          <button
            onClick={handleToggleAllMonths}
            className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg cursor-pointer ${
              seeAllMonths
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-purple-500'
            }`}
            title="Toggle View All Months"
          >
            <CalendarRange size={16} className={seeAllMonths ? "text-white" : "text-purple-500"} />
            <span className="hidden md:inline">{seeAllMonths ? 'Showing All Months' : 'All Months'}</span>
          </button>

          {/* 5. TIME PROGRESSBAR FILTER BUTTON */}
          <button
            onClick={handleProgressBar}
            className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg cursor-pointer ${
              showProgressBar
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-blue-500'
            }`}
            title={showProgressBar ? "Time Progressbar On" : "Time Progressbar Off"}
          >
            <ClockFadingIcon size={16} className={showProgressBar ? "text-white" : "text-blue-500"} />
            <span className="hidden md:inline">
              {showProgressBar ? 'Progressbar On' : 'Progressbar Off'}
            </span>
          </button>

          {/* 6. TITLE FILTER BUTTON */}
          <button
            onClick={handleTitleBar}
            className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg cursor-pointer ${
              showTitleBar
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-violet-500'
            }`}
            title={showTitleBar ? "TitleBar On" : "TitleBar Off"}
          >
            {showTitleBar ? <Captions size={16} className="text-white" /> : <CaptionsOff size={16} className="text-violet-500" />}
            <span className="hidden md:inline">
              {showTitleBar ? 'TitleBar On' : 'TitleBar Off'}
            </span>
          </button>

        </div>
      </div>

      {/* --- COLLAPSIBLE SEARCH BAR (Conditionally Shown) --- */}
      {showSearchBar && (
        <div className="relative w-full group no-print z-10 md:px-4 px-1">
          <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
          <input 
            type="text"
            placeholder="Search logs fast..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/15 dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700 dark:text-white text-sm font-bold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all shadow-xl"
            autoFocus
          />
        </div>
      )}

      {/* --- CENTERED FULL-WIDTH DATE/MONTH RANGE SELECTION ROW --- */}
{!seeAllMonths && (
  <div className="grid grid-cols-2 gap-2 w-full bg-white/5 dark:bg-slate-800/20 md:p-4 p-2 rounded-3xl border border-gray-100/50 dark:border-slate-700/50 no-print">
    
    {/* From Month Input Selection */}
    <div className="relative flex items-center justify-between gap-3 bg-white/10 dark:bg-slate-800 p-2 md:px-6 px-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl w-full transition-all focus-within:border-pink-500 overflow-hidden cursor-pointer hover:border-pink-400">
      {/* Left side: Pink Icon + Your Custom Formatted Text */}
      <div className="flex items-center gap-3">
        <Calendar size={18} className="text-pink-500 shrink-0" />
        <span className="text-sm font-bold text-gray-900 dark:text-white block md:hidden">
          {fromMonth ? formatMonthMobile(fromMonth) : 'Beginning'}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white hidden md:block">
          {fromMonth ? formatMonthDesktop(fromMonth) : 'Beginning'}
        </span>
      </div>

      {/* Right side: Native Input displaying ONLY the default calendar icon */}
      <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
        <input 
          type="month" 
          value={fromMonth} 
          onChange={e => handleFromMonthChange(e.target.value)} 
          className="absolute inset-0 w-full h-full opacity-100 cursor-pointer text-transparent bg-transparent outline-none border-none [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-datetime-edit]:hidden"
        />
      </div>
    </div>

    {/* To Month Input Selection */}
    <div className="relative flex items-center justify-between gap-3 bg-white/10 dark:bg-slate-800 p-2 md:px-6 px-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl w-full transition-all focus-within:border-pink-500 overflow-hidden cursor-pointer hover:border-pink-400">
      {/* Left side: Pink Icon + Your Custom Formatted Text */}
      <div className="flex items-center gap-3">
        <Calendar size={18} className="text-pink-500 shrink-0" />
        <span className="text-sm font-bold text-gray-900 dark:text-white block md:hidden">
          {toMonth ? formatMonthMobile(toMonth) : 'Today'}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-white hidden md:block">
          {toMonth ? formatMonthDesktop(toMonth) : 'Today'}
        </span>
      </div>

      {/* Right side: Native Input displaying ONLY the default calendar icon */}
      <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
        <input 
          type="month" 
          value={toMonth} 
          onChange={e => handleToMonthChange(e.target.value)} 
          className="absolute inset-0 w-full h-full opacity-100 cursor-pointer text-transparent bg-transparent outline-none border-none [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-datetime-edit]:hidden"
        />
      </div>
    </div>

  </div>
)}

      {/* --- PREMIUM DYNAMIC PULSING LOADING/PROGRESS BAR --- */}
      {isSearching && (
        <div className="">
          <div className="h-full bg-pink-500 rounded-full w-full" />
        </div>
      )}

      {/* --- RENDER CHRONOLOGICAL TIMELINE --- */}
      {isLoadingAllMonths ? (
        <div className="p-16 flex flex-col items-center justify-center gap-4 bg-white/5 dark:bg-slate-800/10 rounded-3xl border border-gray-100/30 dark:border-slate-800/30 no-print">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mt-2">
            Loading Full History...
          </p>
        </div>
      ) : isSearching ? (
        <div className="p-12 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Searching logs...
          </p>
        </div>
      ) : visibleTimeline.length === 0 ? (
        <div className="p-12 text-center text-gray-400 dark:text-slate-500 italic bg-white/10 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800">
          No logs match your filters or criteria.
        </div>
      ) : (
        <div className="space-y-12">
          {visibleTimeline.map((monthGroup) => {
            const currencySymbol = getCurrencySymbol(getAggregateCurrencyDisplay(monthGroup.currencies));

            const sortedDayKeys = Object.keys(monthGroup.days).sort((a, b) => 
              sortAsc ? a.localeCompare(b) : b.localeCompare(a)
            );

            return (
              <div 
                key={monthGroup.monthKey} 
                className="space-y-6 border-l-0 md:border-l-2 border-dashed border-gray-200/50 dark:border-slate-800/80 pl-0 md:pl-6 ml-0 md:ml-4"
              >
                
                {/* --- MONTHLY BANNER CARD --- */}
                {showTitleBar && (
                  <div 
                    onClick={() => selectQuickMonth(monthGroup.monthKey)}
                    className="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border-violet-500/80 dark:border-violet-500 shadow-violet-500/5 no-print cursor-pointer p-4 rounded-3xl border transition-all relative overflow-hidden shadow-lg hover:shadow-2xl group"
                  >
                    <div className="absolute right-0 top-0 w-32 h-32 bg-violet-400/10 dark:bg-violet-500/5 blur-3xl rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500" />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center p-2 rounded-lg bg-pink-500 text-white shadow-xl shadow-violet-500/30 dark:shadow-none shrink-0">
                          <CalendarRange size={22} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                            {monthGroup.monthName}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-full sm:min-w-[450px]">
                        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 p-3 rounded-xl flex items-center gap-2.5">
                          <Trophy size={20} className="text-blue-500 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider leading-none">Score</p>
                            <p className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono mt-1">{monthGroup.monthPoints} <span className="text-[10px]">PTS</span></p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 p-3 rounded-xl flex items-center gap-2.5">
                          <Zap size={20} className="text-violet-500 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider leading-none">Activity</p>
                            <p className="text-sm font-black text-violet-600 dark:text-violet-400 font-mono mt-1">{monthGroup.monthLogsCount} <span className="text-[10px]">ITEMS</span></p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 p-3 rounded-xl flex items-center gap-2.5">
                          <TrendingUp size={20} className="text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider leading-none">Income</p>
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                              {monthGroup.monthCredit > 0 ? `+${monthGroup.monthCredit}${currencySymbol}` : `0${currencySymbol}`}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 p-3 rounded-xl flex items-center gap-2.5">
                          <Coins size={20} className="text-red-500 shrink-0" />
                          <div>
                            <p className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider leading-none">Expenses</p>
                            <p className="text-sm font-black text-red-600 dark:text-red-400 font-mono mt-1">
                              {monthGroup.monthDebit > 0 ? `-${monthGroup.monthDebit}${currencySymbol}` : `0${currencySymbol}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- DAILY RECORD ENTRIES --- */}
                <div className="md:space-y-8 space-y-3">
                  {sortedDayKeys.map((dateKey) => {
                    const dayItems = monthGroup.days[dateKey];
                    const dayPoints = dayItems.reduce((sum, item) => sum + item.points, 0);
                    const dayDebit = dayItems.reduce((sum, item) => sum + (item.debit || 0), 0);
                    const dayCredit = dayItems.reduce((sum, item) => sum + (item.credit || 0), 0);
                    const hasGoalInDay = dayItems.some(item => isGoalEntry(item));

                    return (
                      <div key={dateKey} className="md:space-y-4 space-y-2">
                        <div className="flex items-center justify-between w-full md:gap-3 gap-1">
                          <h4 className="text-base font-black text-blue-500 flex items-center gap-2 drop-shadow-sm">
                            {hasGoalInDay ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/50">
                                <Star size={10} fill="currentColor" />
                              </div>
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                            )}
                            {getFormattedDateFast(dateKey)}
                          </h4>
                          
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <div className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-blue-600/20 uppercase tracking-widest">
                              {dayPoints} PTS
                            </div>
                            {dayCredit > 0 && (
                              <div className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-emerald-500/20 tracking-widest">
                                +{dayCredit} {getCurrencySymbol(getAggregateCurrencyDisplay(dayItems))}
                              </div>
                            )}
                            {dayDebit > 0 && (
                              <div className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-red-500/20 tracking-widest">
                                -{dayDebit} {getCurrencySymbol(getAggregateCurrencyDisplay(dayItems))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid md:gap-6 gap-3">
                          {dayItems.map(item => {
                            const goalAchieved = isGoalEntry(item);
                            const hasCash = isCashEntry(item);
                            return (
                              <div 
                                key={item.id} 
                                className={`bg-white dark:bg-slate-800/80 md:p-6 p-3 md:rounded-3xl rounded-2xl border transition-all shadow-xl backdrop-blur-sm relative group ${
                                  goalAchieved 
                                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                                    : 'border-gray-100 dark:border-slate-700'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      <NotebookPen size={14} className="text-pink-600" />
                                      <h4 className="md:text-2xl text-sm font-black uppercase tracking-tight dark:text-white">{item.name}</h4>
                                      <div className="flex gap-1">
                                        {goalAchieved && (
                                          <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-500 text-[10px] px-2.5 py-1 rounded-full font-black uppercase border border-emerald-500/20">
                                            <Star size={10} fill="currentColor" /> Goal
                                          </div>
                                        )}
                                        {hasCash && (
                                          <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 text-[10px] px-2.5 py-1 rounded-full font-black uppercase border border-amber-500/20">
                                            <Banknote size={10} /> Transaction
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 dark:text-slate-400">
                                      <span className="flex items-center gap-1.5">
                                        <Clock size={14} /> {item.isLongEvent ? `${item.fromTime || item.toTime} - ${item.toTime || item.fromTime}` : item.fromTime || item.toTime}
                                      </span>
                                      <span className={`${item.points >= 0 ? 'text-blue-500 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                                        {item.points >= 0 ? `+${item.points}` : item.points} PTS
                                      </span>
                                      {hasCash && (
                                        <div className="flex gap-2 font-black">
                                          {item.debit! > 0 && <span className="text-red-500">-{item.debit}{getCurrencySymbol(item.moneyCode)}</span>}
                                          {item.credit! > 0 && <span className="text-emerald-500">+{item.credit}{getCurrencySymbol(item.moneyCode)}</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 no-print">
                                    <button onClick={() => onEdit(item)} className="p-2 opacity-30 group-hover:opacity-100 hover:text-blue-500 dark:text-white transition-all"><Edit2 size={18}/></button>
                                    <button onClick={() => onDelete(item.id)} className="p-2 opacity-30 group-hover:opacity-100 hover:text-red-500 dark:text-white transition-all"><Trash2 size={18}/></button>
                                  </div>
                                </div>
                                
                                {item.description && item.description.trim() !== "" && (
                                  <p className="md:text-sm text-xs whitespace-pre-wrap break-all w-full mt-3 leading-relaxed border-l-4 border-blue-500/30 dark:border-blue-400/20 pl-3 md:py-3 py-1 bg-gray-50 dark:bg-slate-900 rounded-r-xl dark:text-slate-300">
                                    {item.description}
                                  </p>
                                )}

                                {item.attachment && (
                                  <div className="mt-2 no-print max-w-full overflow-hidden">
                                    <a 
                                      href={item.attachment} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className="flex items-center gap-2.5 w-full max-w-[280px] sm:max-w-md text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800/60 shadow-sm transition-all duration-200 group active:scale-[0.99]"
                                      title={item.attachment}
                                    >
                                      <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-md bg-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/50 group-hover:text-white transition-colors duration-200">
                                        <Paperclip size={13} className="transition-transform group-hover:-rotate-12 shrink-0" />
                                      </div>
                                      <span className="truncate font-medium tracking-wide text-[11px] font-mono text-left select-all flex-1 min-w-0 block">
                                        {item.attachment}
                                      </span>
                                    </a>
                                  </div>
                                )}

                                {/* --- TIME PROGRESS BAR INTEGRATION --- */}
                                {showProgressBar && (item.fromTime || item.toTime) && (
                                  <TimeProgressBar
                                    startTime={item.fromTime || item.toTime || ""}
                                    endTime={item.isLongEvent ? (item.toTime || item.fromTime) : undefined}
                                    isGoal={goalAchieved}
                                  />
                                )}

                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {chronologicalTimeline.length > visibleMonthsCount && (
            <div className="flex justify-center pt-6 no-print">
              <button
                onClick={() => setVisibleMonthsCount(prev => prev + 3)}
                className="px-8 py-3 bg-white dark:bg-slate-800 hover:bg-pink-500 hover:text-white dark:hover:bg-pink-600 dark:hover:text-white dark:text-white text-gray-700 font-black text-xs uppercase tracking-widest rounded-2xl border border-gray-200 dark:border-slate-700 hover:border-pink-500 shadow-xl transition-all cursor-pointer inline-flex items-center gap-2"
              >
                Load More Months
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiaryView;