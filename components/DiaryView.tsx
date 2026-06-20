import React, { useState } from 'react';
import { ActivityEntry, Goal } from '../types';
import { getCurrencySymbol, getAggregateCurrencyDisplay } from '../constants';
import { Trash2, Edit2, BookText, Clock, Paperclip, Calendar, Star, Banknote, NotebookPen, Search, ArrowUpDown, FileText, FileX, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface DiaryViewProps {
  entries: ActivityEntry[];
  goals: Goal[];
  onEdit: (entry: ActivityEntry) => void;
  onDelete: (id: string) => void;
}

// Updated type to handle granular cash filter views
type ViewType = 'all' | 'transactions' | 'debit' | 'credit';

const DiaryView: React.FC<DiaryViewProps> = ({ entries, goals, onEdit, onDelete }) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default to current month and year
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [sortAsc, setSortAsc] = useState(false); // Default: Descending (latest first)
  const [seeAllMonths, setSeeAllMonths] = useState(false); // Default: false
  const [viewType, setViewType] = useState<ViewType>('all'); 
  
  // Description sorting filter: 'all' | 'with-desc' | 'no-desc'
  const [descFilter, setDescFilter] = useState<'all' | 'with-desc' | 'no-desc'>('all');

  const isGoalEntry = (entry: ActivityEntry) => goals.some(g => g.code === entry.code && g.achievedAt === entry.toDate);
  const isCashEntry = (entry: ActivityEntry) => !!(entry.debit || entry.credit);

  // Filter logic: Matches Month + Search Term + View Type + Description Presence
  const diaryEntries = entries
    .filter(e => {
      // 1. Month validation
      const matchesMonth = seeAllMonths ? true : (e.toDate && e.toDate.startsWith(selectedMonth));
      
      // 2. Search term validation
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        e.name.toLowerCase().includes(searchLower) ||
        e.code.toLowerCase().includes(searchLower) ||
        (e.description && e.description.toLowerCase().includes(searchLower));
      
      // 3. View type validation (Expanded for granular Cash filters)
      let matchesViewType = true;
      if (viewType === 'transactions') matchesViewType = isCashEntry(e);
      if (viewType === 'debit') matchesViewType = !!(e.debit && e.debit > 0);
      if (viewType === 'credit') matchesViewType = !!(e.credit && e.credit > 0);
      
      // 4. Description filter validation
      const hasDesc = e.description && e.description.trim() !== "";
      let matchesDesc = true;
      if (descFilter === 'with-desc') matchesDesc = !!hasDesc;
      if (descFilter === 'no-desc') matchesDesc = !hasDesc;
      
      return matchesMonth && matchesSearch && matchesViewType && matchesDesc;
    })
    .sort((a, b) => {
      const dateCompare = sortAsc ? a.toDate.localeCompare(b.toDate) : b.toDate.localeCompare(a.toDate);
      return dateCompare || a.toTime.localeCompare(b.toTime);
    });

  const groupedEntries = diaryEntries.reduce((acc, entry) => {
    if (!acc[entry.toDate]) acc[entry.toDate] = [];
    acc[entry.toDate].push(entry);
    return acc;
  }, {} as Record<string, ActivityEntry[]>);

  const monthDisplay = seeAllMonths 
    ? "All Time" 
    : new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Cycle description filter through states: all -> with-desc -> no-desc -> all
  const handleDescFilterCycle = () => {
    if (descFilter === 'all') setDescFilter('with-desc');
    else if (descFilter === 'with-desc') setDescFilter('no-desc');
    else setDescFilter('all');
  };

  // Cycle cash view states: all -> transactions -> debit -> credit -> all
  const handleCashFilterCycle = () => {
    if (viewType === 'all') setViewType('transactions');
    else if (viewType === 'transactions') setViewType('debit');
    else if (viewType === 'debit') setViewType('credit');
    else setViewType('all');
  };

  return (
    <div className="space-y-6">

{/* --- COMPACT CONSOLIDATED ROW: TITLE, SEARCH, AND BUTTONS IN ONE LINE ON DESKTOP --- */}
<div className="relative grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-4 items-center w-full overflow-visible md:p-4 p-1">
  
  {/* Large Decorative Background Icon */}
  <div className="absolute top-1 -translate-y-10 -right-10 text-pink-500/20 dark:text-pink-400/15 pointer-events-none select-none z-0 transform rotate-12">
    <BookText size={180} strokeWidth={1.2} />
  </div>

  {/* Left Section: Icon + Headings */}
  <div className="flex items-center gap-4 relative z-10 shrink-0 whitespace-nowrap">
    {/* Upgraded BookText Icon Badge */}
    <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/50 shadow-sm shadow-pink-100/50 dark:shadow-none shrink-0 transition-transform hover:scale-105">
      <BookText size={24} strokeWidth={2.2} />
      {/* Subtle glow effect breaking outside the badge */}
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
  
  {/* Centered Search Input Box - Takes up all available middle space */}
  <div className="relative w-full group no-print z-10">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
    <input 
      type="text"
      placeholder="Search logs..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 bg-white/10 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 dark:text-white text-sm font-bold outline-none focus:border-pink-500 transition-all shadow-lg"
    />
  </div>

  {/* Filter Action Buttons Layout Line */}
  <div className="flex items-center justify-start lg:justify-end w-full gap-1.5 md:gap-2 no-print z-10">
    
    {/* 1. MONTH SELECTION UI (Optimized layout for mobile views) */}
    <div className="flex items-center gap-1 md:gap-2 bg-white/10 dark:bg-slate-800 h-[46px] px-2 md:px-3 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl shrink-0">
      <Calendar size={16} className="text-pink-500 shrink-0" />
      <input 
        type="month" 
        value={selectedMonth} 
        onChange={e => setSelectedMonth(e.target.value)} 
        disabled={seeAllMonths}
        className="bg-transparent dark:text-white border-none text-xs md:text-sm font-bold outline-none cursor-pointer focus:ring-0 disabled:opacity-30 disabled:cursor-not-allowed max-w-[105px] md:max-w-none px-0 md:px-1"
      />
    </div>

    {/* 2. ALL MONTHS TOGGLE BUTTON */}
    <button
      onClick={() => setSeeAllMonths(!seeAllMonths)}
      className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg ${
        seeAllMonths
          ? 'bg-purple-600 text-white border-purple-600'
          : 'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-purple-500'
      }`}
      title="Toggle View All Months"
    >
      <Calendar size={16} className={seeAllMonths ? "text-white" : "text-purple-500"} />
      <span className="hidden md:inline">{seeAllMonths ? 'Showing All Months' : 'All Months'}</span>
    </button>

    {/* 3. SORT BUTTON */}
    <button 
      onClick={() => setSortAsc(!sortAsc)}
      className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg ${
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

    {/* 4. DYNAMIC CASH FILTER SELECTION TAB BUTTON */}
    <button
      onClick={handleCashFilterCycle}
      className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg ${
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

    {/* 5. DESCRIPTION FILTER BUTTON */}
    <button
      onClick={handleDescFilterCycle}
      className={`shrink-0 h-[46px] px-3 md:px-4 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-lg ${
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

  </div>
</div>


      {/* --- RENDERED DIARY ENTRIES --- */}
      {Object.keys(groupedEntries).length === 0 ? (
        <div className="p-12 text-center text-gray-400 dark:text-slate-500 italic bg-white/10 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800">
          {searchTerm || viewType !== 'all' || descFilter !== 'all' ? "No logs match your filters or criteria." : "No descriptive logs found for this period."}
        </div>
      ) : (
        <div className="md:space-y-8 space-y-2">
          {Object.keys(groupedEntries).map((date) => {
            const items = groupedEntries[date];
            const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
            
            // Financial calculations for the header row metrics
            const totalDebit = items.reduce((sum, item) => sum + (item.debit || 0), 0);
            const totalCredit = items.reduce((sum, item) => sum + (item.credit || 0), 0);
            
            const hasGoalInDay = items.some(item => isGoalEntry(item));
            return (
              <div key={date} className="md:space-y-4 space-y-2">
                <div className="flex items-center justify-between w-full md:gap-3 gap-1">
                  
                  <h3 className="text-lg font-black text-blue-500 flex items-center gap-2 drop-shadow-sm">
                    {hasGoalInDay ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/50">
                        <Star size={10} fill="currentColor" />
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                    )}
                    {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </h3>
                  
                  {/* --- FINANCIAL SUM LABELS --- */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="bg-blue-600 text-white items-right text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-blue-600/20 uppercase tracking-widest">
                      {totalPoints} PTS
                    </div>
                    {totalCredit > 0 && (
                      <div className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-emerald-500/20 tracking-widest">
                        +{totalCredit} {getCurrencySymbol(getAggregateCurrencyDisplay(items))}
                      </div>
                    )}
                    {totalDebit > 0 && (
                      <div className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-red-500/20 tracking-widest">
                        -{totalDebit} {getCurrencySymbol(getAggregateCurrencyDisplay(items))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid md:gap-6 gap-3">
                  {items.map(item => {
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
                                <Clock size={14} /> {item.isLongEvent ? `${item.fromTime} - ${item.toTime}` : item.toTime}
                              </span>
                              <span className="text-blue-500 dark:text-blue-400 font-black">+{item.points} PTS</span>
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
                        
                        {/* --- CONDITIONALLY RENDER BLOCK ONLY IF DESCRIPTION CONTENT EXISTS --- */}
                        {item.description && item.description.trim() !== "" && (
                          <p className="md:text-sm text-xs whitespace-pre-wrap mt-3 leading-relaxed border-l-4 border-blue-500/30 dark:border-blue-400/20 pl-3 md:py-3 py-1 bg-gray-50 dark:bg-slate-900 rounded-r-xl dark:text-slate-300">
                            {item.description}
                          </p>
                        )}

                        {item.attachment && (
                          <a 
                            href={item.attachment} 
                            target="_blank" 
                            rel="noreferrer"
                            className="md:mt-6 mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 bg-blue-500/5 px-4 py-2 rounded-xl hover:bg-blue-500/10 transition-all border border-blue-500/20 shadow-sm no-print"
                          >
                            <Paperclip size={14} /> View Attachment
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DiaryView;