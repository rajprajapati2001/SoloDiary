import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Plus, Home, List, Target, BarChart3, Sun, Moon, BookText, Loader2, User, CalendarSync, Mic } from 'lucide-react';
import { motion } from 'motion/react';
const Dashboard = lazy(() => import('./components/Dashboard'));
import EntryForm from './components/EntryForm';
import VoiceRecognitionModal from './components/VoiceRecognitionModal';
import { ParsedVoiceResult } from './utils/voiceParser';
const GoalsView = lazy(() => import('./components/GoalsView'));
const ActivitiesView = lazy(() => import('./components/ActivitiesView'));
const DiaryView = lazy(() => import('./components/DiaryView'));
const AutoFill = lazy(() => import('./components/AutoFill'));
const StatsView = lazy(() => import('./components/StatsView'));
const Footer = lazy(() => import('./components/Footer'));
const NoInternet = lazy(() => import('./components/NoInternet'));
import { ActivityEntry, Goal, ActivityTemplate, Page } from './types';
import { getDB } from './db';
import { INITIAL_ACTIVITIES } from './constants';
import { AssistantActions, AssistantRecordInput } from './assistantActions';
import UserIcon from './assets/icons/user.png';
import MainLogo from "./assets/icons/solodiary_icon.ico";

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="animate-spin text-blue-500" size={32} />
  </div>
);

const PAGE_ORDER: Page[] = ['home', 'activities', 'goals', 'diary', 'auto', 'chart'];

const NAV_ITEMS: Array<{ id: Page; icon: any; label: string }> = [
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

const NavItem: React.FC<{ icon: any; label: string; id: Page; isActive: boolean; isDarkMode: boolean; onNavigate: (id: Page) => void }> = ({ icon: Icon, label, id, isActive, isDarkMode, onNavigate }) => {
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
  const [hasBootedForm] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ActivityEntry | null>(null);
  const [currentTimeClass, setCurrentTimeClass] = useState('sky-12-00');
  const [themeReady, setThemeReady] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [fabReady, setFabReady] = useState(false);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'initial'>('initial');
  const [isStatsFullscreen, setIsStatsFullscreen] = useState(false);
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

      const sortedEntries = (entriesData as ActivityEntry[]).sort((a, b) => {
        const dateA = a.toDate || a.fromDate || '';
        const dateB = b.toDate || b.fromDate || '';
        const timeA = a.toTime || a.fromTime || '';
        const timeB = b.toTime || b.fromTime || '';
        return dateB.localeCompare(dateA) || timeB.localeCompare(timeA);
      });
      setEntries(sortedEntries);
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
          .sort((a, b) => {
            const dateA = a.toDate || a.fromDate || '';
            const dateB = b.toDate || b.fromDate || '';
            const timeA = a.toTime || a.fromTime || '';
            const timeB = b.toTime || b.fromTime || '';
            return dateA.localeCompare(dateB) || timeA.localeCompare(timeB);
          });

        const achievedAt = matches.length > 0 ? (matches[0].toDate || matches[0].fromDate) : null;
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
      if (document.body.dataset.disableSwipeNav === 'true') return;
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (document.body.dataset.disableSwipeNav === 'true') return;
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

  // Scroll detection to auto-shrink FAB buttons from 14 to 9 h/w
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPos = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          setIsScrolledDown(scrollPos > 35);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsScrolledDown(false);
  }, [currentPage]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const shouldShrinkOnScroll = isScrolledDown && isMobile;

  const openEntryForm = useCallback((entry: ActivityEntry | null) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  }, []);

  const closeEntryForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEntry(null);
  }, []);

  const handleVoiceFillFromApp = useCallback((parsed: ParsedVoiceResult) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = now.toTimeString().slice(0, 5);

    const defaultCurr = (typeof window !== 'undefined' && localStorage.getItem('solo_diary_default_currency')) || 'INR';

    const voiceEntry: ActivityEntry = {
      id: Math.random().toString(36).substr(2, 9),
      isLongEvent: parsed.isLongEvent,
      fromDate: parsed.fromDate || today,
      fromTime: parsed.fromTime || currentTime,
      toDate: parsed.isLongEvent ? (parsed.toDate || parsed.fromDate || today) : null,
      toTime: parsed.isLongEvent ? (parsed.toTime || currentTime) : null,
      code: parsed.code,
      name: parsed.name,
      points: parsed.points,
      debit: parsed.debit || 0,
      credit: parsed.credit || 0,
      moneyCode: parsed.moneyCode || defaultCurr,
      description: parsed.description || '',
      createdAt: Date.now()
    };

    openEntryForm(voiceEntry);
  }, [openEntryForm]);

  useEffect(() => {
    const updateTimeClass = () => {
      const now = new Date();
      const hour = now.getHours();
      const minuteSlot = now.getMinutes() < 30 ? '00' : '30';
      const timeClass = `sky-${hour.toString().padStart(2, '0')}-${minuteSlot}`;
      setCurrentTimeClass(timeClass);
    };
    updateTimeClass();
    const timer = setInterval(updateTimeClass, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveEntry = async (entry: ActivityEntry) => {
    const db = await getDB();
    await db.put('entries', entry);

    const exists = entries.some(e => e.id === entry.id);
    let newEntries: ActivityEntry[];
    if (exists) {
      newEntries = entries.map(e => e.id === entry.id ? entry : e);
    } else {
      newEntries = [entry, ...entries];
    }

    // Sort safely descending
    newEntries.sort((a, b) => {
      const dateA = a.toDate || a.fromDate || '';
      const dateB = b.toDate || b.fromDate || '';
      const timeA = a.toTime || a.fromTime || '';
      const timeB = b.toTime || b.fromTime || '';
      return dateB.localeCompare(dateA) || timeB.localeCompare(timeA);
    });

    setEntries(newEntries);
    syncGoalsWithEntries(newEntries);
    setIsFormOpen(false);
    setEditingEntry(null);
    await fetchData();
  };

  const handleAddEntries = async (newEntries: ActivityEntry[]) => {
    const db = await getDB();
    const tx = db.transaction('entries', 'readwrite');
    await Promise.all(newEntries.map(e => tx.store.put(e)));
    await tx.done;

    const updatedEntries = [...newEntries, ...entries].sort((a, b) => {
      const dateA = a.toDate || a.fromDate || '';
      const dateB = b.toDate || b.fromDate || '';
      const timeA = a.toTime || a.fromTime || '';
      const timeB = b.toTime || b.fromTime || '';
      return dateB.localeCompare(dateA) || timeB.localeCompare(timeA);
    });
    setEntries(updatedEntries);
    syncGoalsWithEntries(updatedEntries);
  };

  const handleAssistantRecord = useCallback(async (input: AssistantRecordInput) => {
    const requestedActivity = String(input.name || input.activity || input.code || '').trim();
    const matchedTemplate = templates.find(template =>
      template.name.toLowerCase() === requestedActivity.toLowerCase() ||
      template.code.toLowerCase() === requestedActivity.toLowerCase()
    );
    const name = String(input.name || input.activity || matchedTemplate?.name || '').trim();
    if (!name) return;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentTime = now.toTimeString().slice(0, 5);
    const fromDate = input.date?.trim() || today;
    const fromTime = input.time?.trim() || currentTime;
    const secondTime = input.secondTime?.trim() || input.toTime?.trim() || '';
    const toDate = input.toDate?.trim() || (secondTime ? fromDate : null);
    const points = input.points === undefined ? (matchedTemplate?.points || 0) : (Number(input.points) || 0);
    const cash = Number(input.cash || 0) || 0;
    const debit = Number(input.debit || 0) || (cash < 0 ? Math.abs(cash) : 0);
    const credit = Number(input.credit || 0) || (cash > 0 ? cash : 0);
    const entry: ActivityEntry = {
      id: Math.random().toString(36).slice(2, 11),
      isLongEvent: Boolean(secondTime),
      fromDate,
      fromTime,
      toDate,
      toTime: secondTime || null,
      code: String(input.code || matchedTemplate?.code || '').trim(),
      name,
      points,
      debit,
      credit,
      moneyCode: String(input.currency || localStorage.getItem('solo_diary_default_currency') || 'INR'),
      description: String(input.description || '').trim(),
      attachment: '',
      createdAt: Date.now(),
    };

    const db = await getDB();
    await db.put('entries', entry);
    await fetchData();
  }, [fetchData, templates]);

  useEffect(() => {
    let disposed = false;
    let recordListener: { remove: () => Promise<void> } | undefined;
    let addEntryListener: { remove: () => Promise<void> } | undefined;
    let voiceFillListener: { remove: () => Promise<void> } | undefined;

    const setupAssistantAndWidgetListeners = async () => {
      // Also check URL parameter for browser / PWA fallback
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'add_entry') {
          openEntryForm(null);
          setCurrentPage('home');
          window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        } else if (urlParams.get('action') === 'voice_fill') {
          setIsVoiceModalOpen(true);
          setCurrentPage('home');
          window.history.replaceState({}, '', window.location.pathname + window.location.hash);
        }
      } catch (e) {
        // ignore
      }

      try {
        // 1. Check if launched cold from Android 1x1 Widget
        const launch = await AssistantActions.checkLaunchIntent();
        if (!disposed && launch?.openVoice) {
          setIsVoiceModalOpen(true);
          setCurrentPage('home');
        } else if (!disposed && launch?.openForm) {
          openEntryForm(null);
          setCurrentPage('home');
        }

        // 2. Listen if app is already running and brought to front from Android Widget
        voiceFillListener = await AssistantActions.addListener('openVoiceFill', (data) => {
          if (!disposed && data?.openVoice) {
            setIsVoiceModalOpen(true);
            setCurrentPage('home');
          }
        });

        addEntryListener = await AssistantActions.addListener('openAddEntry', (data) => {
          if (!disposed && data?.openForm) {
            openEntryForm(null);
            setCurrentPage('home');
          }
        });

        // 3. Listen for Assistant addRecord
        recordListener = await AssistantActions.addListener('addRecord', handleAssistantRecord);
      } catch (err) {
        console.warn('Widget / Assistant listener error:', err);
      }
    };

    setupAssistantAndWidgetListeners();

    return () => {
      disposed = true;
      recordListener?.remove();
      addEntryListener?.remove();
      voiceFillListener?.remove();
    };
  }, [handleAssistantRecord, openEntryForm]);

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
    const goalToDelete = goals.find(g => g.id === id);
    await db.delete('goals', id);
    setGoals(p => p.filter(i => i.id !== id));

    if (goalToDelete) {
      const targetCode = goalToDelete.code;
      const allEntries = await db.getAll('entries');
      const entriesToDelete = allEntries.filter((e: any) => e.code === targetCode);

      for (const entry of entriesToDelete) {
        await db.delete('entries', entry.id);
      }

      const remainingEntries = entries.filter(e => e.code !== targetCode);
      setEntries(remainingEntries);
      syncGoalsWithEntries(remainingEntries);
    }
  };

  const handleEditGoal = async (g: Goal) => {
    const db = await getDB();
    const oldGoal = goals.find(item => item.id === g.id);
    await db.put('goals', g);
    setGoals(p => p.map(i => i.id === g.id ? g : i));

    if (oldGoal) {
      const oldCode = oldGoal.code;
      const newCode = g.code;
      const newName = g.name;

      // Sync auto templates as well!
      try {
        const allAuto = await db.getAll('auto_templates');
        const txAuto = db.transaction('auto_templates', 'readwrite');
        for (const at of allAuto) {
          if (at.code && at.code.toUpperCase() === oldCode.toUpperCase()) {
            at.code = newCode;
            at.name = newName;
            await txAuto.store.put(at);
          }
        }
        await txAuto.done;
      } catch (err) {
        console.error('Error syncing auto_templates during goal edit:', err);
      }

      const tx = db.transaction('entries', 'readwrite');
      const updatedEntries = entries.map(e => {
        if (e.code === oldCode) {
          const updatedEntry = {
            ...e,
            code: newCode,
            name: newName
          };
          tx.store.put(updatedEntry);
          return updatedEntry;
        }
        return e;
      });
      await tx.done;

      setEntries(updatedEntries);
      syncGoalsWithEntries(updatedEntries);
    } else {
      syncGoalsWithEntries(entries);
    }
  };

  const handleTemplateAction = async (action: 'add' | 'edit' | 'delete', t: any) => {
    const db = await getDB();
    if (action === 'add' || action === 'edit') {
      if (action === 'edit') {
        const oldTemplate = templates.find(item => item.id === t.id);
        if (oldTemplate) {
          const oldCode = oldTemplate.code;
          const newCode = t.code;
          const newName = t.name;

          // Sync auto templates as well!
          try {
            const allAuto = await db.getAll('auto_templates');
            const txAuto = db.transaction('auto_templates', 'readwrite');
            for (const at of allAuto) {
              if (at.code && at.code.toUpperCase() === oldCode.toUpperCase()) {
                at.code = newCode;
                at.name = newName;
                await txAuto.store.put(at);
              }
            }
            await txAuto.done;
          } catch (err) {
            console.error('Error syncing auto_templates during template edit:', err);
          }

          setEntries(p => p.map(e => {
            if (e.code.toUpperCase() === oldCode.toUpperCase()) {
              return {
                ...e,
                code: newCode,
                name: newName
              };
            }
            return e;
          }));
        }
      }

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

      {!isStatsFullscreen && (
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
      )}

      <main className={`${isStatsFullscreen ? 'w-full max-w-none p-0 m-0' : 'max-w-7xl mx-auto md:px-4 px-2.5 md:py-4 py-2'} flex-1 print:p-0 print:m-0 print:max-w-none w-full overflow-x-hidden`}>
        <Suspense fallback={<PageLoader />}>
        <div key={currentPage} style={{ animation: `${slideDir === 'initial' ? 'slide-in-up' : slideDir === 'left' ? 'slide-in-left' : 'slide-in-right'} 0.3s ease-out both` }}>
        {currentPage === 'home' && (
          <Dashboard
            userName={userName || 'User'}
            entries={entries}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEdit={(entry) => openEntryForm(entry)}
            onDelete={handleDeleteEntry}
            onUpdateUserName={handleUpdateUserName}
            goals={goals}
            currentTimeClass={currentTimeClass}
          />
        )}
        {currentPage === 'activities' && (
          <ActivitiesView
            templates={templates}
            entries={entries}
            goals={goals}
            onAdd={t => handleTemplateAction('add', t)}
            onEdit={t => handleTemplateAction('edit', t)}
            onDelete={id => handleTemplateAction('delete', id)}
          />
        )}
        {currentPage === 'goals' && (
          <GoalsView
            userName={userName || 'User'}
            goals={goals}
            entries={entries}
            templates={templates}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            onEditGoal={handleEditGoal}
          />
        )}
        {currentPage === 'diary' && (
          <DiaryView
            entries={entries}
            goals={goals}
            onEdit={(entry) => openEntryForm(entry)}
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
          <StatsView
            userName={userName || 'User'}
            entries={entries}
            goals={goals}
            onRefresh={fetchData}
            onFullscreenChange={setIsStatsFullscreen}
          />
        )}
        </div>
        </Suspense>
      </main>

      {!isStatsFullscreen && <Footer isFull={currentPage === 'home' || currentPage === 'chart'} />}

      {/* Floating Action Buttons Container: Mic and Plus together on Bottom-Right */}
      <motion.div
        layout={isMobile}
        className={`fixed bottom-4 right-4 flex items-center z-40 no-print transition-all duration-300 ${
          shouldShrinkOnScroll ? 'gap-2' : 'gap-2.5 sm:gap-3'
        } ${
          fabReady && currentPage === 'home' ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0 pointer-events-none'
        }`}
      >
        {/* Voice Recognition Pop Button in Violet (Icon only, no text) */}
        <motion.button
          layout={isMobile}
          whileHover={{ scale: 1.08, shadow: "0px 15px 30px rgba(139,92,246,0.55)" }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          onClick={() => setIsVoiceModalOpen(true)}
          className={`${
            shouldShrinkOnScroll
              ? 'h-9 w-9 shadow-lg shadow-violet-500/40'
              : 'h-14 w-14 shadow-[0_10px_25px_-5px_rgba(139,92,246,0.6)]'
          } bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0`}
          title="Voice to Fill Entry"
          aria-label="Voice to Fill Entry"
        >
          <Mic
            size={shouldShrinkOnScroll ? 16 : 24}
            className="drop-shadow-md transition-all duration-300"
          />
        </motion.button>

        {/* Plus Button in Blue */}
        <motion.button
          layout={isMobile}
          whileHover={{ scale: 1.12, rotate: 90, shadow: "0px 15px 30px rgba(59,130,246,0.45)" }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          onClick={() => openEntryForm(null)}
          className={`${
            shouldShrinkOnScroll
              ? 'w-9 h-9 shadow-lg shadow-blue-500/40'
              : 'w-14 h-14 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.5)]'
          } bg-gradient-to-br from-blue-500 to-indigo-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0`}
          title="Add Entry"
          aria-label="Add Entry"
        >
          <Plus
            size={shouldShrinkOnScroll ? 18 : 30}
            strokeWidth={shouldShrinkOnScroll ? 2.5 : 3}
            className="drop-shadow-md transition-all duration-300"
          />
        </motion.button>
      </motion.div>

      {hasBootedForm && (
        <EntryForm
          isOpen={isFormOpen}
          onClose={closeEntryForm}
          onSave={handleSaveEntry}
          initialData={editingEntry}
          templates={templates}
          goals={goals}
        />
      )}

      <VoiceRecognitionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onFill={handleVoiceFillFromApp}
        templates={templates}
        goals={goals}
      />
    </div>
  );
};

export default App;