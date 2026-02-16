import React from 'react';
import { Facebook, Instagram, Send, Mail, Github, MessageCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import MainLogo from '../assets/icons/solodiary_icon.ico'

interface FooterProps {
  isFull: boolean;
}

const Footer: React.FC<FooterProps> = ({ isFull }) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
      { name: 'GitHub', icon: Github, url: 'https://github.com/rajprajapati2001', color: 'text-gray-400 dark:hover:text-white' },
      { name: 'Instagram', icon: Instagram, url: 'https://www.instagram.com/raj_pankaj_prajapati', color: 'text-pink-500' },
      { name: 'Gmail', icon: Mail, url: 'mailto:rp5876907@gmail.com', color: 'text-red-500' },
      { name: 'Telegram', icon: Send, url: 'https://t.me/raj_prajapati14022001', color: 'text-blue-500' },
      { name: 'Facebook', icon: Facebook, url: 'https://www.facebook.com', color: 'text-blue-600' },
      { name: 'WhatsApp', icon: MessageCircle, url: 'https://wa.me/+916353636344', color: 'text-green-500' },
  ];

  // Function to handle links natively in Android
  const handleLink = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    
    // Check if the app is running as a native Android/iOS app
    const isNative = Capacitor.isNativePlatform();

    if (url.startsWith('http')) {
      if (isNative) {
        // Opens in a native Custom Tab (Android) or SafariView (iOS)
        await Browser.open({ url });
      } else {
        // Opens in a new tab on standard web browsers
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Standard handling for mailto, tel, or whatsapp protocol links
      // This triggers the device's native app selector (e.g., opens Gmail app)
      window.location.href = url;
    }
  };

  if (!isFull) {
    return (
      <footer className="py-4 border-t border-gray-200 dark:border-slate-800 text-center no-print">
        <p className="text-[8px] font-bold text-gray-100 dark:text-slate-500 uppercase tracking-[0.2em]">
          &copy; {currentYear} • SoloDiary @ Raj Prajapati.
        </p>
      </footer>
    );
  }

  return (
    <footer className="mt-12 border-t border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm no-print rounded-t-[3rem]">
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="md:pb-8 md:pl-2 md:pr-2 flex flex-col md:flex-row justify-between items-center gap-8 border-b border-gray-100 dark:border-slate-800 mb-10">
          <div className="flex items-center gap-4 group cursor-default">
  {/* Logo Container with Tilt Effect */}
  <div className="w-14 h-14 rounded-2xl bg-[#0A2647] flex items-center justify-center border-2 border-blue-400 shadow-xl transition-all duration-300 group-hover:rotate-6 group-hover:scale-105">
    <img 
      src={MainLogo} 
      alt="SoloDiary Logo" 
      className="h-10 w-10 object-contain" 
    />
  </div>

  {/* Text Content */}
  <div className="text-left">
    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none mb-1">
      SoloDiary
    </h3>
    
    {/* Primary Tagline */}
    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] leading-none mb-1">
      Think. Write. Grow.
    </p>
    
    {/* Secondary Privacy Tagline */}
    <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 italic">
      Where your stories stay yours.
    </p>
  </div>
</div>

          <div className="flex flex-wrap justify-center gap-3 bg-gray-50 dark:bg-slate-800/50 p-2 md:mb-0 mb-4 rounded-[2rem] border border-gray-100 dark:border-slate-700">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                onClick={(e) => handleLink(e, link.url)} // Added native handler
                className={`md:p-3 p-1 rounded-full bg-white dark:bg-slate-900 shadow-sm transition-all hover:scale-110 hover:shadow-md ${link.color}`}
                aria-label={link.name}
              >
                <link.icon size={20} />
              </a>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.3em] leading-relaxed">
            &copy; {currentYear} • SoloDiary @ <span className="text-blue-600">Raj Prajapati<br/></span>All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
