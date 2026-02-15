import React, { useState } from 'react';
import { WifiOff, RefreshCw, Globe, ChevronRight, AlertCircle } from 'lucide-react';
import NoInternetIcon from '../assets/no_internet_dribbble.gif';

interface NoInternetProps {
  onRetry?: () => void;
}

const NoInternet: React.FC<NoInternetProps> = ({ onRetry }) => {
  const [showToast, setShowToast] = useState(false);

  const handleRefresh = () => {
    if (!navigator.onLine) {
      // Still offline? Show the toast
      setShowToast(true);
      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } else {
      // Online? Trigger the retry logic
      if (onRetry) onRetry();
      else window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-white overflow-hidden font-sans">
      
      {/* 1. TOAST NOTIFICATION */}
      <div className={`absolute top-10 left-6 right-6 z-[110] transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500">
          <AlertCircle size={20} className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-wider">Still Offline</span>
            <span className="text-[10px] opacity-90 font-medium">Please check your data settings.</span>
          </div>
        </div>
      </div>

      {/* 2. Header Section */}
      <div className="md:hidden w-full pt-16 flex flex-col items-center">
        <div className="relative">
          <div className="absolute inset-0 bg-red-100 animate-ping rounded-full opacity-30" />
          <div className="relative bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-full shadow-inner">
            <WifiOff size={28} className="text-red-500" />
          </div>
        </div>
      </div>

      <div className="hidden md:block pt-5">
  <h2 className="text-3xl font-[900] tracking-tight text-center text-slate-900 leading-tight">
    Whoops! <br />
    <span className="text-red-500">No Connection</span>
  </h2>
</div>

      {/* 3. Main Illustration */}
      <div className="w-full flex justify-center px-4 transform scale-110">
        <div className="w-full max-w-sm">
          <img 
            src={NoInternetIcon} 
            alt="No Connection" 
            className="w-full h-auto object-contain mix-blend-multiply"
          />
        </div>
      </div>

      {/* 4. Text & Interaction Area */}
      <div className="w-full max-w-md px-10 pb-12 flex flex-col items-center">
        <div className="md:hidden space-y-2 mb-8 text-center">
          <h2 className="text-3xl font-[900] tracking-tight text-slate-900 leading-tight">
            Whoops! <br />
            <span className="text-red-500">No Connection</span>
          </h2>
          <p className="text-slate-500 text-sm font-semibold leading-relaxed max-w-[250px] mx-auto">
            We can't reach the server right now. Check your Wi-Fi or mobile data.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRefresh}
          className="group relative flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white font-bold rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <RefreshCw 
            size={18} 
            className={`transition-transform duration-700 ease-in-out text-blue-400 ${showToast ? 'rotate-180' : 'group-hover:rotate-180'}`} 
          />
          <span className="uppercase tracking-[0.15em] text-xs">Try Reconnecting</span>
          <ChevronRight size={16} className="opacity-50 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Bottom Footer Info */}
        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
          <Globe size={12} className="text-slate-400" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-slate-400">
            SoloDiary • Offline Mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default NoInternet;