import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, X, Zap, Clock, Sparkles, Check, RefreshCw, Target, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react';
import { ActivityTemplate, Goal } from '../types';
import { parseVoiceInput, ParsedVoiceResult, capitalizeFirst } from '../utils/voiceParser';
import { INITIAL_ACTIVITIES, CURRENCY_MAP, getCurrencySymbol } from '../constants';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capacitor-community/speech-recognition';

/**
 * ============================================================================
 * TIME-BASED SUGGESTED SPOKEN PHRASES (SHORTCUT FILLING)
 * Developers / Users can easily add or edit your shortcuts & codes below:
 * Format: { label: 'Button text', phrase: 'Spoken text to fill form' }
 * ============================================================================
 */
export const TIME_PERIOD_SUGGESTIONS = [
  {
    id: 'early_morning',
    name: 'Early Morning (4 AM - 7 AM)',
    shortLabel: '4-7 AM',
    items: [
      { label: 'sleep 10', phrase: 'sleep 10' },
      { label: 'fresh 1', phrase: 'fresh 1' },
      { label: 'bath 5', phrase: 'bath 5' },
      { label: 'mahadev mandir 5', phrase: 'mahadev mandir 5' },
      { label: 'walk run exercise 20', phrase: 'walk run exercise 20' }
    ]
  },
  {
    id: 'morning',
    name: 'Morning (7 AM - 12 PM)',
    shortLabel: '7-12 PM',
    items: [
      { label: 'breakfast 2', phrase: 'breakfast 2' },
      { label: 'travel 2', phrase: 'travel 2' },
      { label: 'job 15', phrase: 'job 15' },
      { label: 'walking 5', phrase: 'walking 5' },
      { label: 'reactjs project 10', phrase: 'reactjs project 10' }
    ]
  },
  {
    id: 'afternoon',
    name: 'Afternoon (12 PM - 5 PM)',
    shortLabel: '12-5 PM',
    items: [
      { label: 'lunch 5', phrase: 'lunch 5' },
      { label: 'sleep 3', phrase: 'sleep 3' },
      { label: 'meal 2', phrase: 'meal 2' },
      { label: 'drawing 10', phrase: 'drawing 10' },
      { label: 'free time 5', phrase: 'free time 5' }
    ]
  },
  {
    id: 'evening',
    name: 'Evening (5 PM - 9 PM)',
    shortLabel: '5-9 PM',
    items: [
      { label: 'walking 10', phrase: 'walking 10' },
      { label: 'bath 5', phrase: 'bath 5' },
      { label: 'painting 20', phrase: 'painting 20' },
      { label: 'video editing 10', phrase: 'video editing 10' },
      { label: 'shopping debit 500', phrase: 'shopping debit 500' }
    ]
  },
  {
    id: 'night',
    name: 'Night & Sleep (9 PM - 4 AM)',
    shortLabel: '9-4 AM',
    items: [
      { label: 'dinner 5', phrase: 'dinner 5' },
      { label: 'phone call 2', phrase: 'phone call 2' },
      { label: 'diary 10', phrase: 'diary 10' },
      { label: 'reactjs learning 20', phrase: 'reactjs learning 20' },
      { label: 'no quite escape 1', phrase: 'no quite escape 1' }
    ]
  }
];

interface VoiceRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFill: (parsedData: ParsedVoiceResult) => void;
  templates?: ActivityTemplate[];
  goals?: Goal[];
}

export const VoiceRecognitionModal: React.FC<VoiceRecognitionModalProps> = ({
  isOpen,
  onClose,
  onFill,
  templates = [],
  goals = []
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [manualText, setManualText] = useState('');

  const recognitionRef = useRef<any>(null);
  const isStoppingRef = useRef(false);

  // Default currency check
  const defaultCurrency = useMemo(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('solo_diary_default_currency')) || 'INR';
  }, []);

  const defaultCurrencySymbol = useMemo(() => {
    return CURRENCY_MAP[defaultCurrency]?.symbol ?? getCurrencySymbol(defaultCurrency);
  }, [defaultCurrency]);

  // Combine user templates with INITIAL_ACTIVITIES
  const allTemplates = useMemo(() => {
    const list: ActivityTemplate[] = [...INITIAL_ACTIVITIES];
    templates.forEach(ut => {
      if (!list.some(it => it.code.toUpperCase() === ut.code.toUpperCase())) {
        list.push(ut);
      }
    });
    return list;
  }, [templates]);

  // Filter active goals (exclude achieved goals like in EntryForm)
  const activeGoals = useMemo(() => goals.filter(g => !g.achievedAt), [goals]);

  // Check Speech recognition support (Native Android or Web Speech)
  useEffect(() => {
    let isMounted = true;
    const checkAvailability = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const { available } = await NativeSpeechRecognition.available();
          if (isMounted) setIsSupported(available);
        } catch (e) {
          console.warn('Native speech recognition check error:', e);
          if (isMounted) setIsSupported(true);
        }
      } else {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (isMounted) setIsSupported(!!SpeechRecognition);
      }
    };
    checkAvailability();
    return () => { isMounted = false; };
  }, []);

  // Parse voice text into structured data
  const updateParsedData = useCallback((textToParse: string) => {
    if (textToParse.trim().length > 0) {
      const result = parseVoiceInput(textToParse, allTemplates, activeGoals);
      setParsedResult(result);
    } else {
      setParsedResult(null);
    }
  }, [allTemplates, activeGoals]);

  // Update parsed preview whenever transcript or manual input changes
  useEffect(() => {
    const activeText = transcript || manualText;
    updateParsedData(activeText);
  }, [transcript, manualText, updateParsedData]);

  // Clean stop recognition
  const stopListening = useCallback(async () => {
    isStoppingRef.current = true;
    if (Capacitor.isNativePlatform()) {
      try {
        await NativeSpeechRecognition.stop();
      } catch (e) {
        // ignore
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    }
    setIsListening(false);
  }, []);

  // Low-level recognition runner
  const startListening = useCallback(async () => {
    setErrorMessage(null);
    isStoppingRef.current = false;

    // --- 1. NATIVE ANDROID CAPACITOR PATH ---
    if (Capacitor.isNativePlatform()) {
      try {
        // Step A: Request/Check RECORD_AUDIO permission natively
        const permStatus = await NativeSpeechRecognition.checkPermissions();
        if (permStatus.speechRecognition !== 'granted') {
          const requested = await NativeSpeechRecognition.requestPermissions();
          if (requested.speechRecognition !== 'granted') {
            setIsListening(false);
            setErrorMessage('Microphone permission was not granted. Please allow microphone access in Android settings.');
            return;
          }
        }

        setIsListening(true);
        setErrorMessage(null);

        // Step B: Use native Android speech dialog (popup: true)
        // This is 100% reliable on all Android devices (Samsung, Xiaomi, Pixel, etc.)
        // and guarantees voice input is captured even when WebView Speech API is blocked or offline
        const result = await NativeSpeechRecognition.start({
          language: 'en-US',
          maxResults: 5,
          prompt: 'Speak your activity entry (e.g. gym 15, dinner 5)',
          popup: true,
          partialResults: false
        });

        setIsListening(false);

        if (result?.matches && result.matches.length > 0) {
          const spoken = result.matches[0].trim();
          if (spoken) {
            setTranscript(spoken);
            setManualText(spoken);
          }
        }
      } catch (err: any) {
        console.warn('Native speech recognition event:', err);
        setIsListening(false);
        const msg = (err?.message || String(err)).toLowerCase();
        // Error code 7 is SpeechRecognizer.ERROR_NO_MATCH (user didn't speak in time)
        // Error code 8 is SpeechRecognizer.ERROR_RECOGNIZER_BUSY
        // 'cancel' or 'abort' means user tapped outside or closed dialog
        if (
          !msg.includes('cancel') &&
          !msg.includes('abort') &&
          !msg.includes('7') &&
          !msg.includes('no match')
        ) {
          setErrorMessage('Could not capture audio. Tap the mic to try again or type below.');
        }
      }
      return;
    }

    // --- 2. BROWSER WEB SPEECH API PATH ---
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage('Web Speech Recognition is not supported in this browser. Please type your entry below.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = currentTranscript.trim();
        setTranscript(clean);
        setManualText(clean);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'not-allowed') {
          setIsListening(false);
          setErrorMessage('Microphone blocked by browser settings. Please allow mic in permissions or type below.');
        } else if (event.error === 'no-speech') {
          // quiet timeout
        } else if (event.error === 'network') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (!isStoppingRef.current) {
          setIsListening(false);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('recognition.start() exception:', err);
      setIsListening(false);
    }
  }, []);

  // Toggle listening on user click
  const handleToggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
      return;
    }

    setErrorMessage(null);

    // In web browser only, safely trigger getUserMedia to prompt permission if ungranted
    if (!Capacitor.isNativePlatform() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err: any) {
        console.warn('getUserMedia prompt result:', err);
      }
    }

    await startListening();
  }, [isListening, startListening, stopListening]);

  // When modal opens, start listening smoothly
  useEffect(() => {
    let cancelTimer = false;
    if (isOpen) {
      setTranscript('');
      setManualText('');
      setErrorMessage(null);
      setParsedResult(null);
      isStoppingRef.current = false;

      // Small delay on open to allow modal animation to mount cleanly
      const timer = setTimeout(() => {
        if (!cancelTimer) {
          startListening();
        }
      }, 350);

      return () => {
        cancelTimer = true;
        clearTimeout(timer);
      };
    } else {
      stopListening();
      if (Capacitor.isNativePlatform()) {
        NativeSpeechRecognition.removeAllListeners().catch(() => {});
      }
    }
  }, [isOpen, startListening, stopListening]);

  // Handle dropdown change for custom activity or goal
  const handleActivitySelection = (val: string) => {
    if (!val) return;
    const [type, itemCode] = val.split(':');
    if (type === 'custom') {
      return;
    }
    if (type === 'goal') {
      const g = activeGoals.find(x => x.code.toUpperCase() === itemCode.toUpperCase());
      if (g) {
        setParsedResult(prev => {
          if (!prev) {
            return {
              code: g.code,
              name: g.name,
              points: g.points,
              isGoal: true,
              isNewActivity: false,
              isLongEvent: false,
              debit: 0,
              credit: 0,
              isCashTransaction: false,
              moneyCode: defaultCurrency,
              isDescriptionOpen: false,
              rawTranscript: transcript || manualText
            };
          }
          return {
            ...prev,
            code: g.code,
            name: g.name,
            points: g.points,
            isGoal: true,
            isNewActivity: false
          };
        });
      }
    } else {
      const t = allTemplates.find(x => x.code.toUpperCase() === itemCode.toUpperCase());
      if (t) {
        setParsedResult(prev => {
          if (!prev) {
            return {
              code: t.code,
              name: t.name,
              points: t.points,
              isGoal: false,
              isNewActivity: false,
              isLongEvent: false,
              debit: 0,
              credit: 0,
              isCashTransaction: false,
              moneyCode: defaultCurrency,
              isDescriptionOpen: false,
              rawTranscript: transcript || manualText
            };
          }
          return {
            ...prev,
            code: t.code,
            name: t.name,
            points: t.points,
            isGoal: false,
            isNewActivity: false
          };
        });
      }
    }
  };

  // Handle Apply to Form
  const handleApply = () => {
    if (!parsedResult) return;

    // Ensure default currency is checked and applied
    const finalResult: ParsedVoiceResult = {
      ...parsedResult,
      moneyCode: parsedResult.moneyCode || defaultCurrency,
      description: parsedResult.description ? capitalizeFirst(parsedResult.description) : '',
      isCashTransaction: !!((parsedResult.debit && parsedResult.debit > 0) || (parsedResult.credit && parsedResult.credit > 0))
    };

    stopListening();
    onFill(finalResult);
    onClose();
  };

  // ============================================================================
  // TIME-BASED SUGGESTED SPOKEN PHRASES (SHORTCUT FILLING)
  // Developers / Users can easily add or edit shortcut phrases here!
  // ============================================================================
  const [selectedPeriodTab, setSelectedPeriodTab] = useState<string>('now');

  // Compute active suggestions based on current time or chosen tab
  const activeSuggestions = useMemo(() => {
    const currentHour = new Date().getHours();
    const getCurrentPeriodId = (hour: number): string => {
      if (hour >= 4 && hour < 7) return 'early_morning';
      if (hour >= 7 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 21) return 'evening';
      return 'night';
    };

    if (selectedPeriodTab === 'all') {
      return TIME_PERIOD_SUGGESTIONS.flatMap(p => p.items.map(it => ({ ...it, periodLabel: p.shortLabel })));
    }

    const targetId = selectedPeriodTab === 'now' ? getCurrentPeriodId(currentHour) : selectedPeriodTab;
    const period = TIME_PERIOD_SUGGESTIONS.find(p => p.id === targetId);
    return period ? period.items.map(it => ({ ...it, periodLabel: period.shortLabel })) : [];
  }, [selectedPeriodTab]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            stopListening();
            onClose();
          }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-violet-100 dark:border-violet-900/40 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Top Decorative Violet Header Bar */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-5 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Mic size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight">Voice to Fill Entry</h3>
                </div>
                <p className="text-[10px] text-violet-100 font-semibold uppercase tracking-wider">
                  Speak to autofill record
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                stopListening();
                onClose();
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 md:p-6 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* Center Animated Mic Pulse Button */}
<div className={`flex items-center justify-between gap-4 py-3 px-4 rounded-2xl border transition-all duration-300 shadow-sm ${
  isListening 
    ? 'bg-violet-50/80 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 shadow-violet-500/10' 
    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
}`}>
  {/* Left: Microphone Button with Clean Ripple Effect */}
  <div className="relative flex items-center justify-center">
    {/* Smooth Ripple Effect Rings */}
    {isListening && (
      <>
        <span className="absolute w-14 h-14 rounded-full bg-violet-500/30 animate-ping pointer-events-none" />
        <span className="absolute w-12 h-12 rounded-full bg-violet-500/20 animate-pulse pointer-events-none" />
      </>
    )}

    <button
      type="button"
      onClick={handleToggleListening}
      className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer ${
        isListening
          ? 'bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 text-white shadow-violet-500/40 scale-105 ring-2 ring-violet-300 dark:ring-violet-700'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-600'
      }`}
      title={isListening ? 'Tap to pause' : 'Tap to speak'}
    >
      {isListening ? (
        <Mic size={20} />
      ) : (
        <MicOff size={20} />
      )}
    </button>
  </div>

  {/* Right: Status Indicator & Text */}
  <div className="flex-1 flex items-center justify-between min-w-0">
    {isListening ? (
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mini Wave Bars */}
        <div className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
          <span className="inline-block w-1 h-3.5 bg-violet-600 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
          <span className="inline-block w-1 h-5 bg-purple-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
          <span className="inline-block w-1 h-2.5 bg-indigo-600 rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
        </div>
        <span className="font-bold text-xs uppercase tracking-wide text-violet-700 dark:text-violet-300 truncate">
          Say activity <span className="font-normal opacity-75 hidden sm:inline">(e.g. "Yoga 15")</span>
        </span>
      </div>
    ) : (
      <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider truncate">
        {transcript ? 'Voice captured · Ready' : 'Tap mic to speak (or type below)'}
      </span>
    )}

    {/* Status Pill */}
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ml-2 shrink-0 transition-colors ${
      isListening 
        ? 'bg-violet-200 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
    }`}>
      {isListening ? 'Listening' : 'Ready'}
    </span>
  </div>
</div>



            {/* Error Guidance if any */}
            {errorMessage && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center justify-between gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-amber-600" />
                  <p className="font-semibold">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>Retry Mic</span>
                </button>
              </div>
            )}

<div className="text-[10px]">
  <span className="font-semibold">eg:</span> <span className="text-violet-400">activity point debit amount at time to time description ...</span> 
<br></br>
  <span className="font-semibold">test:</span> <span className="text-violet-400">Meal 5 debit 250 at 1pm to 3pm description KFC Burger</span> 
</div>            

            {/* Live Transcript / Manual Input Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Spoken Words / Fast Input
                </label>
                {(Boolean(transcript) || Boolean(manualText)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTranscript('');
                      setManualText('');
                      setParsedResult(null);
                      setErrorMessage(null);
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/40 dark:text-slate-300 dark:hover:text-red-400 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={manualText}
                  onChange={(e) => {
                    setManualText(e.target.value);
                    setTranscript(e.target.value);
                  }}
                  placeholder="Spoken or typed words appear here... (e.g. 'Yoga 15 at 6:30 AM' or 'Gameplay 20 at 5 PM debit 250 steam game')"
                  rows={4}
                  className="w-full min-h-[110px] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white font-medium text-sm outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-all resize-y shadow-inner leading-relaxed"
                />
              </div>
            </div>

            {/* Parsed Live Preview Card with Dropdown & Editable Fields */}
            {parsedResult && (
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
                parsedResult.isGoal
                  ? 'bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-slate-800 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-700/60'
                  : parsedResult.isNewActivity
                    ? 'bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-violet-50/30 dark:from-slate-800 dark:to-emerald-950/20 border-emerald-300 dark:border-emerald-700/60'
                    : 'bg-gradient-to-br from-violet-50 to-purple-50/50 dark:from-slate-800 dark:to-violet-950/20 border-violet-200/80 dark:border-violet-800/40'
              }`}>
                
                {/* Header of Detected Fields */}
                <div className="flex items-center justify-between border-b pb-2 border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-1.5 text-xs">
                    {parsedResult.isNewActivity ? (
                      <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-white">
                        <Sparkles size={14} className="text-emerald-500 shrink-0" />
                        <span>Activity</span>
                        <span className="font-extrabold text-violet-600 dark:text-violet-400">{parsedResult.name.toLowerCase()}</span>
                        <span className="text-slate-400 font-mono">({parsedResult.code.toLowerCase()})</span>

                      </div>
                    ) : parsedResult.isGoal ? (
                      <div className="flex items-center gap-1 font-bold text-emerald-800 dark:text-emerald-200">
                        <Target size={14} className="text-emerald-600 shrink-0" />
                        <span>Goal</span>
                        <span className="font-extrabold text-emerald-600">{parsedResult.name.toLowerCase()}</span>
                        <span className="text-emerald-600/70 font-mono">({parsedResult.code.toLowerCase()})</span>
                        <span className="text-amber-500 font-bold text-[10px]"> +{parsedResult.points}p</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-white">
                        <Zap size={14} className="text-violet-600 shrink-0" />
                        <span>Activity</span>
                        <span className="font-extrabold text-violet-600 dark:text-violet-400">{parsedResult.name.toLowerCase()}</span>
                        <span className="text-slate-400 font-mono">({parsedResult.code.toLowerCase()})</span>
                        <span className="text-amber-500 font-bold text-[10px]"> +{parsedResult.points}p</span>
                      </div>
                    )}
                  </div>

                  {(parsedResult.isNewActivity || parsedResult.isGoal) && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                      parsedResult.isNewActivity
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700'
                    }`}>
                      {parsedResult.isNewActivity ? 'New Activity' : 'Goal'}
                    </span>
                  )}
                </div>

                {/* Time & Duration Info */}
                <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-violet-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1">
                    <Clock size={11} className="text-blue-500" /> Time Setting:
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {parsedResult.fromTime || 'Now'}
                    {parsedResult.isLongEvent && parsedResult.toTime ? ` to ${parsedResult.toTime}` : ''}
                  </span>
                </div>                

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* 1. Activity Dropdown (Shows Green if Goal or New) */}
                  <div className={`p-2.5 rounded-xl border transition-all ${
                    parsedResult.isGoal
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-200 dark:ring-emerald-900/50'
                      : parsedResult.isNewActivity
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-600'
                        : 'bg-white dark:bg-slate-900/80 border-violet-100 dark:border-slate-700/60'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-bold uppercase flex items-center gap-1 ${
                        parsedResult.isGoal 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : parsedResult.isNewActivity
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400'
                      }`}>
                        {parsedResult.isGoal ? <Target size={11} className="text-emerald-600" /> : parsedResult.isNewActivity ? <Sparkles size={11} className="text-emerald-500" /> : <Zap size={11} className="text-violet-500" />}
                        {parsedResult.isGoal ? 'Goal Item' : parsedResult.isNewActivity ? 'Detected Activity' : 'Activity'}
                      </span>
                      {parsedResult.isGoal && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.25 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100">
                          Goal
                        </span>
                      )}
                      {parsedResult.isNewActivity && (
                        <span className="text-[8px] font-black uppercase px-1.5 py-0.25 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300">
                          new
                        </span>
                      )}
                    </div>

                    <select
                      value={
                        parsedResult.isNewActivity
                          ? `custom:${parsedResult.code}`
                          : `${parsedResult.isGoal ? 'goal' : 'activity'}:${parsedResult.code}`
                      }
                      onChange={(e) => handleActivitySelection(e.target.value)}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-black outline-none border cursor-pointer ${
                        parsedResult.isGoal
                          ? 'bg-emerald-100/80 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100'
                          : parsedResult.isNewActivity
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                      }`}
                    >
                      {parsedResult.isNewActivity && (
                        <optgroup label="Detected New Activity">
                          <option value={`custom:${parsedResult.code}`} className="dark:bg-slate-900 px-2 text-slate-900 dark:text-slate-100">
                            {capitalizeFirst(parsedResult.name)}
                          </option>
                        </optgroup>
                      )}
                      <optgroup label="Activities List">
                        {allTemplates.map(t => (
                          <option
                            key={`activity:${t.code}`}
                            value={`activity:${t.code}`}
                            className="dark:bg-slate-900 px-2 text-slate-900 dark:text-slate-200"
                          >
                            {t.name}
                          </option>
                        ))}
                      </optgroup>
                      {activeGoals.length > 0 && (
                        <optgroup label="Goals List">
                          {activeGoals.map(g => (
                            <option
                              key={`goal:${g.code}`}
                              value={`goal:${g.code}`}
                              className="dark:bg-slate-900 px-2 text-slate-900 dark:text-slate-200"
                            >
                              {g.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* 2. Editable Points */}
                  <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-violet-100 dark:border-slate-700/60 shadow-xs flex flex-col justify-between min-w-0">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                      Points (Adjustable)
                    </span>

                    <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => setParsedResult(prev => prev ? { ...prev, points: Math.max(0, prev.points - 1) } : null)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        value={parsedResult.points}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setParsedResult(prev => prev ? { ...prev, points: isNaN(val) ? 0 : val } : null);
                        }}
                        className="w-full min-w-0 text-center font-black text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg py-1 border border-amber-200 dark:border-amber-800/50 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => setParsedResult(prev => prev ? { ...prev, points: prev.points + 1 } : null)}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 font-black text-sm flex items-center justify-center transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cash Transactions: Showing BOTH Debit and Credit using Default Currency */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {/* Debit (Expense) */}
                  <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-red-200/70 dark:border-red-900/40 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-red-500 flex items-center gap-1">
                        <ArrowDownLeft size={11} /> Debit
                      </span>
                      <span className="text-[8px] font-bold text-red-400">Expense ({defaultCurrency})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-red-500 font-bold text-xs">{defaultCurrencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={parsedResult.debit || ''}
                        placeholder="0"
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setParsedResult(prev => prev ? {
                            ...prev,
                            debit: val,
                            isCashTransaction: val > 0 || (prev.credit || 0) > 0
                          } : null);
                        }}
                        className="w-full px-2 py-1 rounded bg-red-50/70 dark:bg-red-950/30 text-red-600 font-black text-xs border border-red-200 dark:border-red-800/40 outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Credit (Income) */}
                  <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase text-emerald-600 flex items-center gap-1">
                        <ArrowUpRight size={11} /> Credit
                      </span>
                      <span className="text-[8px] font-bold text-emerald-500">Income ({defaultCurrency})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-600 font-bold text-xs">{defaultCurrencySymbol}</span>
                      <input
                        type="number"
                        min="0"
                        value={parsedResult.credit || ''}
                        placeholder="0"
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          setParsedResult(prev => prev ? {
                            ...prev,
                            credit: val,
                            isCashTransaction: val > 0 || (prev.debit || 0) > 0
                          } : null);
                        }}
                        className="w-full px-2 py-1 rounded bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-600 font-black text-xs border border-emerald-200 dark:border-emerald-800/40 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>


                {/* Capitalized Notes/Description Field */}
                <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-violet-100 dark:border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400 uppercase text-[9px]">Notes / Story (Capitalized Start)</span>
                    <span className="text-[8px] text-violet-500 font-semibold">Editable</span>
                  </div>
                  <input
                    type="text"
                    value={parsedResult.description || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setParsedResult(prev => prev ? {
                        ...prev,
                        description: val,
                        isDescriptionOpen: val.trim().length > 0
                      } : null);
                    }}
                    placeholder="Notes (first letter will be capitalized)..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {/* Time-Based Spoken Phrase Suggestions */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Clock size={12} className="text-violet-500" />
                  Suggestion Time Phrase
                </span>
                <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Period Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setSelectedPeriodTab('now')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedPeriodTab === 'now'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  ⚡ Now
                </button>
                {TIME_PERIOD_SUGGESTIONS.map(period => (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => setSelectedPeriodTab(period.id)}
                    className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg transition-all shrink-0 cursor-pointer ${
                      selectedPeriodTab === period.id
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {period.shortLabel}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedPeriodTab('all')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded-lg transition-all shrink-0 cursor-pointer ${
                    selectedPeriodTab === 'all'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
              </div>

              {/* Suggestions Chips Grid */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {activeSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTranscript(item.phrase);
                      setManualText(item.phrase);
                      updateParsedData(item.phrase);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-violet-100 hover:text-violet-700 dark:bg-slate-800 dark:hover:bg-violet-950/40 dark:text-slate-300 dark:hover:text-violet-300 transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={() => {
                stopListening();
                onClose();
              }}
              className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-black rounded-2xl transition-all uppercase tracking-wider text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!parsedResult}
              className="flex-[2] py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white font-black rounded-2xl shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Check size={18} /> Fill Form
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default VoiceRecognitionModal;
