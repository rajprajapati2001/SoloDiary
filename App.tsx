import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Home, List, Target, BarChart3, Sun, Moon, BookText, Loader2, User, CalendarSync } from 'lucide-react';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import GoalsView from './components/GoalsView';
import ActivitiesView from './components/ActivitiesView';
import DiaryView from './components/DiaryView';
import AutoFill from './components/AutoFill';
import StatsView from './components/StatsView';
import Footer from './components/Footer';
import NoInternet from './components/NoInternet';
import { ActivityEntry, Goal, ActivityTemplate, Page, AutoTemplate } from './types';
import { getDB } from './db';
import { INITIAL_ACTIVITIES } from './constants';
import UserIcon from './assets/icons/user.png';
import MainLogo from "./assets/icons/solodiary_icon.ico";

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
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    window.location.hash = `#/${currentPage}`;
  }, [currentPage]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') as Page;
      if (['home', 'activities', 'goals', 'diary', 'auto', 'chart'].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
  }, [isDarkMode]);

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

  const NavItem = ({ icon: Icon, label, id }: { icon: any, label: string, id: Page }) => {
    const isActive = currentPage === id;

    const getTabColor = () => {
      if (!isActive) return 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800';
      switch (id) {
        case 'home': return isDarkMode ? 'bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-black text-white shadow-[0_0_8px_rgba(0,0,0,0.8)]';
        case 'activities': return 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.8)]';
        case 'goals': return 'bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.8)]';
        case 'diary': return 'bg-pink-500 text-white shadow-[0_0_8px_rgba(236,72,153,0.8)]';
        case 'auto': return 'bg-violet-500 text-white shadow-[0_0_8px_rgba(139,92,246,0.8)]';
        case 'chart': return isDarkMode ? 'bg-white text-black shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-black text-white shadow-[0_0_8px_rgba(0,0,0,0.8)]';
        default: return '';
      }
    };

    const getIconGlow = () => {
      if (!isActive) return '';
      switch (id) {
        case 'home': return isDarkMode ? 'drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]';
        case 'activities': return 'drop-shadow-[0_0_4px_rgba(59,130,246,0.8)]';
        case 'goals': return 'drop-shadow-[0_0_4px_rgba(34,197,94,0.8)]';
        case 'diary': return 'drop-shadow-[0_0_4px_rgba(236,72,153,0.8)]';
        case 'auto': return 'drop-shadow-[0_0_4px_rgba(139,92,246,0.8)]';
        case 'chart': return isDarkMode ? 'drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]' : 'drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]';
        default: return '';
      }
    };

    return (
      <button
        onClick={() => setCurrentPage(id)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${getTabColor()}`}
      >
        <Icon size={20} className={getIconGlow()} />
        <span className="hidden lg:inline font-bold">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-gray-50 dark:bg-slate-950 print:bg-white print:dark:bg-white flex flex-col">
      {showNamePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black backdrop-blur-xl">
          <form onSubmit={handleSaveName} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/20 w-full max-w-md space-y-6 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-blue-600/10 border-blue border-2 border-dotted rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/50 mb-4">
              <img src={UserIcon} size={20} className="p-2" alt="User" />
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
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all uppercase tracking-[0.2em] text-sm">
              Initialize Profile
            </button>
          </form>
        </div>
      )}

      <nav className="sticky top-0 z-40 bg-white-900/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => {
            setCurrentPage('home');
            window.location.hash = '#/home';
          }} className="flex items-center gap-3 cursor-pointer">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#0A2647] flex items-center justify-center border-blue-400 shadow-xl group relative hidden sm:block">
              <img src={MainLogo} alt="Logo" />
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase hidden sm:block">SOLODIARY</h1>
          </div>
          <div className="flex items-center gap-1 md:gap-4 flex-1 justify-center sm:justify-end mr-2 ml-2">
            <NavItem id="home" icon={Home} label="Dashboard" />
            <NavItem id="activities" icon={List} label="Activities" />
            <NavItem id="goals" icon={Target} label="Goals" />
            <NavItem id="diary" icon={BookText} label="Diary" />
            <NavItem id="auto" icon={CalendarSync} label="Auto" />
            <NavItem id="chart" icon={BarChart3} label="Stats" />
          </div>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-4 flex-1 print:p-0 print:m-0 print:max-w-none w-full">
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
      </main>

      <Footer isFull={currentPage === 'home' || currentPage === 'chart'} />

      <button
        onClick={() => { setEditingEntry(null); setIsFormOpen(true); }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 no-print"
      >
        <Plus size={32} strokeWidth={3} />
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
