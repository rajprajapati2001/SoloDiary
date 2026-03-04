import React, { useState } from 'react';
import { ActivityEntry, Goal } from '../types';
import { Trash2, Edit2, Clock, Paperclip, Calendar, Star, Banknote, NotebookPen, Search, ArrowUpDown } from 'lucide-react';

interface DiaryViewProps {
  entries: ActivityEntry[];
  goals: Goal[];
  onEdit: (entry: ActivityEntry) => void;
  onDelete: (id: string) => void;
}

const DiaryView: React.FC<DiaryViewProps> = ({ entries, goals, onEdit, onDelete }) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Default to current month and year
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [sortAsc, setSortAsc] = useState(false); // Default: Descending (latest first)

  // Filter logic: Matches Month + Search Term (Name, Code, or Description)
  const diaryEntries = entries
    .filter(e => {
      const matchesMonth = e.description && e.toDate.startsWith(selectedMonth);
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        e.name.toLowerCase().includes(searchLower) ||
        e.code.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower);
      
      return matchesMonth && matchesSearch;
    })
    .sort((a, b) => {
  const dateCompare = sortAsc ? a.toDate.localeCompare(b.toDate) : b.toDate.localeCompare(a.toDate);
  // Keep time sorting consistent (earliest to latest within the day)
  return dateCompare || a.toTime.localeCompare(b.toTime);
});

  const groupedEntries = diaryEntries.reduce((acc, entry) => {
    if (!acc[entry.toDate]) acc[entry.toDate] = [];
    acc[entry.toDate].push(entry);
    return acc;
  }, {} as Record<string, ActivityEntry[]>);

  const isGoalEntry = (entry: ActivityEntry) => goals.some(g => g.code === entry.code && g.achievedAt === entry.toDate);
  const isCashEntry = (entry: ActivityEntry) => !!(entry.debit || entry.credit);

  const monthDisplay = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white">Personal Diary</h2>
          <p className="text-sm font-bold text-gray-600 dark:text-slate-400">Records for {monthDisplay}</p>
        </div>
        
        <div className="flex flex-row sm:flex-row items-center gap-3 w-full lg:w-auto no-print">
  {/* --- SEARCH INPUT --- */}
  <div className="relative flex-1 sm:w-64 group">
    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
    <input 
      type="text"
      placeholder="Search logs..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 bg-white/10 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 dark:text-white text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-lg"
    />
  </div>

  {/* --- SORT BUTTON --- */}
  <button 
    onClick={() => setSortAsc(!sortAsc)}
    className={`shrink-0 h-[46px] px-4 rounded-2xl border transition-all flex items-center gap-2 font-bold text-sm shadow-lg ${
      sortAsc 
        ? 'bg-blue-600 text-white border-blue-600' 
        : 'bg-white/10 dark:bg-slate-800 dark:text-white border-gray-100 dark:border-slate-700 hover:border-blue-500'
    }`}
    title={sortAsc ? "Showing Oldest First" : "Showing Newest First"}
  >
    <div className={`transition-transform duration-300 ${sortAsc ? 'rotate-180' : 'rotate-0'}`}>
      <ArrowUpDown size={16} /> 
    </div>
    <span className="hidden md:inline">{sortAsc ? 'Oldest' : 'Newest'}</span>
  </button>
</div>

  {/* --- DATE PICKER --- */}
  <div className="flex items-center gap-2 bg-white/10 dark:bg-slate-800 h-[46px] px-3 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xl w-full sm:w-auto">
    <Calendar size={18} className="text-blue-500 shrink-0" />
    <input 
      type="month" 
      value={selectedMonth} 
      onChange={e => setSelectedMonth(e.target.value)} 
      className="bg-transparent dark:text-white border-none text-sm font-bold outline-none cursor-pointer w-full focus:ring-0"
    />
  </div>
      </div>

      {Object.keys(groupedEntries).length === 0 ? (
        <div className="p-12 text-center text-gray-400 dark:text-slate-500 italic bg-white/10 dark:bg-slate-800/50 rounded-3xl border border-gray-100 dark:border-slate-800">
          {searchTerm ? "No logs match your search criteria." : "No descriptive logs found for this period."}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedEntries).map((date) => {
            const items = groupedEntries[date];
            const totalPoints = items.reduce((sum, item) => sum + item.points, 0);
            const hasGoalInDay = items.some(item => isGoalEntry(item));
            return (
              <div key={date} className="space-y-4">
                <div className="flex items-center justify-between w-full gap-3">
                  
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
                <div className="bg-blue-600 text-white items-right text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg shadow-blue-600/20 uppercase tracking-widest">
                    {totalPoints} PTS
                  </div>
                </div>
                <div className="grid gap-6">
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
                        <div className="flex justify-between items-start mb-4">
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
                                  {item.debit! > 0 && <span className="text-red-500">-{item.debit}₹</span>}
                                  {item.credit! > 0 && <span className="text-emerald-500">+{item.credit}₹</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 no-print">
                            <button onClick={() => onEdit(item)} className="p-2 opacity-30 group-hover:opacity-100 hover:text-blue-500 dark:text-white transition-all"><Edit2 size={18}/></button>
                            <button onClick={() => onDelete(item.id)} className="p-2 opacity-30 group-hover:opacity-100 hover:text-red-500 dark:text-white transition-all"><Trash2 size={18}/></button>
                          </div>
                        </div>
                        
                        <p className="md:text-sm text-xs whitespace-pre-wrap leading-relaxed border-l-4 border-blue-500/30 dark:border-blue-400/20 pl-6 md:py-3 py-1 bg-gray-50 dark:bg-slate-900 rounded-r-xl dark:text-slate-300">
                          {item.description}
                        </p>

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