import React, { useState } from 'react';
import { WifiOff, RefreshCw, Globe, ChevronRight, AlertCircle, SignalHigh } from 'lucide-react';

interface NoInternetProps {
  onRetry?: () => void;
}

const NoInternet: React.FC<NoInternetProps> = ({ onRetry }) => {
  const [showToast, setShowToast] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = () => {
    setIsRotating(true);
    
    // Simulate a brief check
    setTimeout(() => {
      if (!navigator.onLine) {
        setShowToast(true);
        setIsRotating(false);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        if (onRetry) onRetry();
        else window.location.reload();
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-500">
      

      {/* 2. TOAST NOTIFICATION */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-sm transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-[12px] font-bold tracking-tight">Signal not found. Check your connection.</p>
        </div>
      </div>

      {/* 3. CONTENT WRAPPER */}
      <div className="relative z-10 flex flex-col items-center text-center px-8">
        
        

        <div className="relative flex items-center justify-center">
          {/* Pulsing Rings */}
          <div className="absolute w-[200px] h-[200px] bg-red-400/10 dark:bg-blue-500/10 rounded-full animate-ping" />
          <div className="absolute w-[400px] h-[400px] border border-slate-100 dark:border-white/5 rounded-full animate-[pulse_4s_linear_infinite]" />
          <div className="absolute w-[600px] h-[600px] border border-slate-50 dark:border-white/[0.02] rounded-full animate-[pulse_6s_linear_infinite]" />
          
          {/* Icon Plate */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-tr from-red-500/20 to-orange-500/20 blur-2xl rounded-full opacity-50" />
          <div className="relative bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
            <div className="relative">
               <WifiOff size={48} className="text-slate-900 dark:text-white" />
               <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
          </div>
        </div>
          
        </div>

        {/* Text Section */}
        <div className="space-y-3 mb-12">
          <h2 className="text-4xl font-[1000] tracking-tighter text-slate-900 dark:text-white leading-none">
            LOST IN <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              SPACE?
            </span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-[260px] mx-auto">
            Your diary is safe, but we need the internet to sync your latest thoughts with the stars.
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full max-w-[280px]">
          <button
            onClick={handleRefresh}
            disabled={isRotating}
            className="group relative flex items-center justify-center gap-3 w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl active:scale-95 transition-all duration-300 overflow-hidden disabled:opacity-70"
          >
            <RefreshCw 
              size={18} 
              className={`transition-transform duration-1000 ${isRotating ? 'animate-spin' : 'group-hover:rotate-180'}`} 
            />
            <span className="uppercase tracking-[0.2em] text-[10px]">Attempt Re-entry</span>
            <ChevronRight size={14} className="opacity-40 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-10 flex items-end gap-3 px-5 py-2.5 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5 backdrop-blur-sm">
          <div className="flex gap-0.5 items-end">
            <div className="w-1 h-4 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="w-1 h-3 bg-slate-300 dark:bg-slate-700 rounded-full" />
            <div className="w-1 h-2 bg-slate-300 dark:bg-slate-700 rounded-full" />
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            SoloDiary • Offline Mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default NoInternet;