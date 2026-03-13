import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Plus, Home, List, Target, BarChart3, Sun, Moon, BookText, Loader2, User, CalendarSync } from 'lucide-react';
const Dashboard = lazy(() => import('./components/Dashboard'));
import EntryForm from './components/EntryForm';
const GoalsView = lazy(() => import('./components/GoalsView'));
const ActivitiesView = lazy(() => import('./components/ActivitiesView'));
const DiaryView = lazy(() => import('./components/DiaryView'));
const AutoFill = lazy(() => import('./components/AutoFill'));
const StatsView = lazy(() => import('./components/StatsView'));
const Footer = lazy(() => import('./components/Footer'));
const NoInternet = lazy(() => import('./components/NoInternet'));
import { ActivityEntry, Goal, ActivityTemplate, Page, AutoTemplate } from './types';
import { getDB } from './db';
import { INITIAL_ACTIVITIES } from './constants';
import UserIcon from './assets/icons/user.png';
import MainLogo from "./assets/icons/solodiary_icon.ico";

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="animate-spin text-blue-500" size={32} />
  </div>
);

const PAGE_ORDER: Page[] = ['home', 'activities', 'goals', 'diary', 'auto', 'chart'];

const NAV_ITEMS: Array<{ id: Page; icon: any; label: string }>  = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'activities', icon: List, label: 'Activities' },
  { id: 'goals', icon: Target, label: 'Goals' },
  { id: 'diary', icon: BookText, label: 'Diary' },
  { id: 'auto', icon: CalendarSync, label: 'Auto' },
  { id: 'chart', icon: BarChart3, label: 'Stats' },
];

const getActivePillClass = (id: Page, isDarkMode: boolean) => {
  switch (id) {
    case 'home':
      return isDarkMode ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]' : 'bg-black shadow-[0_0_12px_rgba(0,0,0,0.55)]';
    case 'activities':
      return 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]';
    case 'goals':
      return 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]';
    case 'diary':
      return 'bg-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.8)]';
    case 'auto':
      return 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.8)]';
    case 'chart':
      return isDarkMode ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)]' : 'bg-black shadow-[0_0_12px_rgba(0,0,0,0.55)]';
    default:
      return '';
  }
};

const getActiveTextClass = (id: Page, isDarkMode: boolean) => {
  if (id === 'home' || id === 'chart') {
    return isDarkMode ? 'text-black' : 'text-white';
  }
  return 'text-white';
};

const getIconGlow = (id: Page, isDarkMode: boolean) => {
  switch (id) {
    case 'home':
      return isDarkMode ? 'drop-shadow-[0_0_5px_rgba(0,0,0,0.45)]' : 'drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]';
    case 'activities':
      return 'drop-shadow-[0_0_6px_rgba(59,130,246,0.85)]';
    case 'goals':
      return 'drop-shadow-[0_0_6px_rgba(34,197,94,0.85)]';
    case 'diary':
      return 'drop-shadow-[0_0_6px_rgba(236,72,153,0.85)]';
    case 'auto':
      return 'drop-shadow-[0_0_6px_rgba(139,92,246,0.85)]';
    case 'chart':
      return isDarkMode ? 'drop-shadow-[0_0_5px_rgba(0,0,0,0.45)]' : 'drop-shadow-[0_0_5px_rgba(255,255,255,0.6)]';
    default:
      return '';
  }
};

const NavItem = ({ icon: Icon, label, id, isActive, isDarkMode, onNavigate }: { icon: any, label: string, id: Page, isActive: boolean, isDarkMode: boolean, onNavigate: (id: Page) => void }) => {

  return (
    <button
      onClick={() => onNavigate(id)}
      className={`relative z-10 w-full flex items-center justify-center gap-2 px-2 md:px-3 py-2 rounded-xl transition-all duration-300 ${
        isActive
          ? getActiveTextClass(id, isDarkMode)
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-slate-800/80'
      }`}
    >
      <Icon size={20} className={`transition-all duration-300 ${id === 'home' ? 'lg:scale-110' : ''} ${isActive ? getIconGlow(id, isDarkMode) : ''}`} />
      <span className="hidden lg:inline font-bold">{label}</span>
    </button>
  );
};

const App: React.FC = () => {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempName, setTempName] = useState('');
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    const hash = window.location.hash.replace('#/', '') as Page;
    return ['home', 'activities', 'goals', 'diary', 'auto', 'chart'].includes(hash) ? hash : 'home';
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('solo_diary_theme');
    return saved ? saved === 'dark' : true;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ActivityEntry | null>(null);
  const [currentTimeClass, setCurrentTimeClass] = useState('sky-12');
  const [themeReady, setThemeReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [fabReady, setFabReady] = useState(false);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'initial'>('initial');
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const navigateTo = useCallback((page: Page) => {
    const oldIdx = PAGE_ORDER.indexOf(currentPage);
    const newIdx = PAGE_ORDER.indexOf(page);
    if (page !== currentPage) {
      setSlideDir(newIdx > oldIdx ? 'left' : 'right');
      setCurrentPage(page);
    }
  }, [currentPage]);

  useEffect(() => {
    window.location.hash = `#/${currentPage}`;
  }, [currentPage]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') as Page;
      if (['home', 'activities', 'goals', 'diary', 'auto', 'chart'].includes(hash)) {
        navigateTo(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigateTo]);

  const fetchData = useCallback(async () => {
    try {
      const db = await getDB();
      const [entriesData, goalsData, templatesData, storedName] = await Promise.all([
        db.getAll('entries'),
        db.getAll('goals'),
        db.getAll('activity_templates'),
        db.get('settings', 'userName')
      ]);

      setEntries((entriesData as ActivityEntry[]).sort((a, b) => b.toDate.localeCompare(a.toDate) || b.toTime.localeCompare(a.toTime)));
      setGoals((goalsData as Goal[]).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));

      if (storedName) {
        setUserName(storedName);
      } else {
        setShowNamePrompt(true);
      }

      if (templatesData && templatesData.length > 0) {
        setTemplates(templatesData as ActivityTemplate[]);
      } else {
        const tx = db.transaction('activity_templates', 'readwrite');
        await Promise.all(INITIAL_ACTIVITIES.map(t => tx.store.put(t)));
        await tx.done;
        setTemplates(INITIAL_ACTIVITIES);
      }
    } catch (error) {
      console.error('Error fetching data from IDB:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const db = await getDB();
    await db.put('settings', tempName.trim(), 'userName');
    setUserName(tempName.trim());
    setShowNamePrompt(false);
  };

  const handleUpdateUserName = async (newName: string) => {
    const db = await getDB();
    await db.put('settings', newName, 'userName');
    setUserName(newName);
  };

  const syncGoalsWithEntries = useCallback(async (currentEntries: ActivityEntry[]) => {
    const db = await getDB();
    setGoals(prevGoals => {
      const updatedGoals = prevGoals.map(g => {
        const matches = currentEntries
          .filter(e => e.code === g.code)
          .sort((a, b) => a.toDate.localeCompare(b.toDate) || a.toTime.localeCompare(b.toTime));

        const achievedAt = matches.length > 0 ? matches[0].toDate : null;
        if (achievedAt !== g.achievedAt) {
          db.put('goals', { ...g, achievedAt: achievedAt || undefined });
          return { ...g, achievedAt: achievedAt || undefined };
        }
        return g;
      });
      return updatedGoals;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('solo_diary_theme', isDarkMode ? 'dark' : 'light');
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // Swipe navigation
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.7) return;
      const idx = PAGE_ORDER.indexOf(currentPage);
      if (dx < 0 && idx < PAGE_ORDER.length - 1) navigateTo(PAGE_ORDER[idx + 1]);
      if (dx > 0 && idx > 0) navigateTo(PAGE_ORDER[idx - 1]);
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage, navigateTo]);

  useEffect(() => {
    setThemeReady(true);
    const t = setTimeout(() => setFabReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const updateTimeClass = () => {
      const hour = new Date().getHours();
      const timeClass = `sky-${hour.toString().padStart(2, '0')}`;
      setCurrentTimeClass(timeClass);
    };
    updateTimeClass();
    const timer = setInterval(updateTimeClass, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveEntry = async (entry: ActivityEntry) => {
    const db = await getDB();
    await db.put('entries', entry);

    let newEntries: ActivityEntry[];
    if (editingEntry) {
      newEntries = entries.map(e => e.id === entry.id ? entry : e);
    } else {
      newEntries = [entry, ...entries];
    }
    setEntries(newEntries);
    syncGoalsWithEntries(newEntries);
    setIsFormOpen(false);
    setEditingEntry(null);
  };
  
  const handleAddEntries = async (newEntries: ActivityEntry[]) => {
    const db = await getDB();
    const tx = db.transaction('entries', 'readwrite');
    await Promise.all(newEntries.map(e => tx.store.put(e)));
    await tx.done;
    
    const updatedEntries = [...newEntries, ...entries].sort((a, b) => b.toDate.localeCompare(a.toDate) || b.toTime.localeCompare(a.toTime));
    setEntries(updatedEntries);
    syncGoalsWithEntries(updatedEntries);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    const db = await getDB();
    await db.delete('entries', id);
    const newEntries = entries.filter(e => e.id !== id);
    setEntries(newEntries);
    syncGoalsWithEntries(newEntries);
  };

  const handleAddGoal = async (g: Goal) => {
    const db = await getDB();
    await db.put('goals', g);
    const newGoals = [g, ...goals];
    setGoals(newGoals);
    syncGoalsWithEntries(entries);
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    const db = await getDB();
    await db.delete('goals', id);
    setGoals(p => p.filter(i => i.id !== id));
  };

  const handleEditGoal = async (g: Goal) => {
    const db = await getDB();
    await db.put('goals', g);
    setGoals(p => p.map(i => i.id === g.id ? g : i));
    syncGoalsWithEntries(entries);
  };

  const handleTemplateAction = async (action: 'add' | 'edit' | 'delete', t: any) => {
    const db = await getDB();
    if (action === 'add' || action === 'edit') {
      await db.put('activity_templates', t);
      if (action === 'add') setTemplates(p => [...p, t]);
      else setTemplates(p => p.map(i => i.id === t.id ? t : i));
    } else if (action === 'delete') {
      await db.delete('activity_templates', t);
      setTemplates(p => p.filter(i => i.id !== t));
    }
  };

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const activeTabIndex = Math.max(0, PAGE_ORDER.indexOf(currentPage));

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <NoInternet onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 print:bg-white print:dark:bg-white flex flex-col ${themeReady ? 'transition-colors duration-500' : ''}`}>
      {showNamePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 welcome-backdrop">
          {/* Animated floating orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="welcome-orb w-72 h-72 bg-blue-500/30 rounded-full absolute -top-20 -left-20" style={{ animationDelay: '0s' }} />
            <div className="welcome-orb w-96 h-96 bg-indigo-500/20 rounded-full absolute -bottom-32 -right-32" style={{ animationDelay: '2s' }} />
            <div className="welcome-orb w-48 h-48 bg-pink-500/25 rounded-full absolute top-1/4 right-10" style={{ animationDelay: '4s' }} />
            <div className="welcome-orb w-64 h-64 bg-cyan-400/20 rounded-full absolute bottom-1/4 -left-16" style={{ animationDelay: '1s' }} />
            <div className="welcome-orb w-40 h-40 bg-violet-500/25 rounded-full absolute top-10 right-1/3" style={{ animationDelay: '3s' }} />
            <div className="welcome-orb w-56 h-56 bg-emerald-400/15 rounded-full absolute bottom-10 left-1/3" style={{ animationDelay: '5s' }} />
          </div>

          <form onSubmit={handleSaveName} className="welcome-form bg-white/90 dark:bg-slate-900/90 p-8 rounded-[2.5rem] shadow-2xl border border-white/30 dark:border-slate-700/50 w-full max-w-md space-y-6 text-center relative backdrop-blur-sm">
            <div className="welcome-icon w-20 h-20 bg-blue-600/10 border-blue border-2 border-dotted rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 mb-4">
              <img src={UserIcon} className="p-2" alt="User" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Welcome Pilot</h2>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Identify yourself to start logs</p>
            </div>
            <input
              autoFocus
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              placeholder="Your Full Name"
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 outline-none text-center font-black uppercase tracking-widest text-lg dark:text-white transition-all"
              required
            />
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-[0.2em] text-sm">
              Initialize Profile
            </button>
          </form>
        </div>
      )}

      <nav className="sticky top-0 z-40 bg-white-900/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => {
            navigateTo('home');
            window.location.hash = '#/home';
          }} className="flex items-center gap-3 cursor-pointer">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#0A2647] flex items-center justify-center border-blue-400 shadow-xl group relative hidden sm:block">
              <img src={MainLogo} alt="Logo" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase hidden sm:block">SOLODIARY</h1>
          </div>
          <div className="relative flex-1 max-w-[760px] ml-2 mr-2">
            <div className="relative grid grid-cols-6 items-center gap-0 p-1 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700">
              <div
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/6)] rounded-xl transition-[transform,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${getActivePillClass(currentPage, isDarkMode)}`}
                style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
              />
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPage === item.id}
                  isDarkMode={isDarkMode}
                  onNavigate={navigateTo}
                />
              ))}
            </div>
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto md:px-4 px-2.5 md:py-4 py-2 flex-1 print:p-0 print:m-0 print:max-w-none w-full overflow-x-hidden">
        <Suspense fallback={<PageLoader />}>
        <div key={currentPage} style={{ animation: `${slideDir === 'initial' ? 'slide-in-up' : slideDir === 'left' ? 'slide-in-left' : 'slide-in-right'} 0.3s ease-out both` }}>
        {currentPage === 'home' && (
          <Dashboard
            userName={userName || 'User'}
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEdit={entry => { setEditingEntry(entry); setIsFormOpen(true); }}
            onDelete={handleDeleteEntry}
            onUpdateUserName={handleUpdateUserName}
            goals={goals}
            currentTimeClass={currentTimeClass}
          />
        )}
        {currentPage === 'activities' && (
          <ActivitiesView
            templates={templates}
            onAdd={t => handleTemplateAction('add', t)}
            onEdit={t => handleTemplateAction('edit', t)}
            onDelete={id => handleTemplateAction('delete', id)}
          />
        )}
        {currentPage === 'goals' && (
          <GoalsView
            userName={userName || 'User'}
            goals={goals}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            onEditGoal={handleEditGoal}
          />
        )}
        {currentPage === 'diary' && (
          <DiaryView
            entries={entries}
            goals={goals}
            onEdit={entry => { setEditingEntry(entry); setIsFormOpen(true); }}
            onDelete={handleDeleteEntry}
          />
        )}
        {currentPage === 'auto' && (
          <AutoFill 
            onAddEntries={handleAddEntries} 
            templates={templates}
            goals={goals}
            entries={entries}
          />
        )}
        {currentPage === 'chart' && (
          <StatsView userName={userName || 'User'} entries={entries} goals={goals} onRefresh={fetchData} />
        )}
        </div>
        </Suspense>
      </main>

      <Footer isFull={currentPage === 'home' || currentPage === 'chart'} />

      <button
  onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}
  className={`group fixed bottom-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-700 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)] flex items-center justify-center hover:scale-110 hover:shadow-[0_20px_35px_-5px_rgba(59,130,246,0.6)] active:scale-95 transition-all duration-500 ease-out z-40 no-print ${fabReady && currentPage === 'home' ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'}`}
>
  <Plus 
    size={32} 
    strokeWidth={3} 
    className="transition-transform duration-500 group-hover:rotate-180 drop-shadow-md" 
  />
</button>

      {isFormOpen && (
        <EntryForm
          onClose={() => { setIsFormOpen(false); setEditingEntry(null); }}
          onSave={handleSaveEntry}
          initialData={editingEntry}
          templates={templates}
          goals={goals}
        />
      )}
    </div>
  );
};

export default App;
