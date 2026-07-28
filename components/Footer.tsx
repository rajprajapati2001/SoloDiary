import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import MainLogo from '../assets/icons/solodiary_icon.ico';

interface FooterProps {
  isFull: boolean;
}

const Footer: React.FC<FooterProps> = ({ isFull }) => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/rajprajapati2001',
      // Original brand color styling for dark/light modes
      svg: (
<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M9.29183 21V18.4407L9.3255 16.6219C9.36595 16.0561 9.58639 15.5228 9.94907 15.11C9.95438 15.1039 9.95972 15.0979 9.9651 15.0919C9.9791 15.0763 9.96988 15.0511 9.94907 15.0485V15.0485C7.52554 14.746 5.0005 13.7227 5.0005 9.26749C4.9847 8.17021 5.3427 7.10648 6.00437 6.27215C6.02752 6.24297 6.05103 6.21406 6.07492 6.18545V6.18545C6.10601 6.1482 6.11618 6.09772 6.10194 6.05134C6.10107 6.04853 6.10021 6.04571 6.09935 6.04289C6.0832 5.9899 6.06804 5.93666 6.05388 5.88321C5.81065 4.96474 5.86295 3.98363 6.20527 3.09818C6.20779 3.09164 6.21034 3.08511 6.2129 3.07858C6.22568 3.04599 6.25251 3.02108 6.28698 3.01493V3.01493C6.50189 2.97661 7.37036 2.92534 9.03298 4.07346C9.08473 4.10919 9.13724 4.14609 9.19053 4.18418V4.18418C9.22901 4.21168 9.27794 4.22011 9.32344 4.20716C9.32487 4.20675 9.32631 4.20634 9.32774 4.20593C9.41699 4.18056 9.50648 4.15649 9.59617 4.1337C11.1766 3.73226 12.8234 3.73226 14.4038 4.1337C14.4889 4.1553 14.5737 4.17807 14.6584 4.20199C14.6602 4.20252 14.6621 4.20304 14.6639 4.20356C14.7174 4.21872 14.7749 4.20882 14.8202 4.17653V4.17653C14.8698 4.14114 14.9187 4.10679 14.967 4.07346C16.6257 2.92776 17.4894 2.9764 17.7053 3.01469V3.01469C17.7404 3.02092 17.7678 3.04628 17.781 3.07946C17.7827 3.08373 17.7843 3.08799 17.786 3.09226C18.1341 3.97811 18.1894 4.96214 17.946 5.88321C17.9315 5.93811 17.9159 5.9928 17.8993 6.04723V6.04723C17.8843 6.09618 17.8951 6.14942 17.9278 6.18875C17.9289 6.18998 17.9299 6.19121 17.9309 6.19245C17.9528 6.21877 17.9744 6.24534 17.9956 6.27215C18.6573 7.10648 19.0153 8.17021 18.9995 9.26749C18.9995 13.747 16.4565 14.7435 14.0214 15.015V15.015C14.0073 15.0165 14.001 15.0334 14.0105 15.0439C14.0141 15.0479 14.0178 15.0519 14.0214 15.0559C14.2671 15.3296 14.4577 15.6544 14.5811 16.0103C14.7101 16.3824 14.7626 16.7797 14.7351 17.1754V21" />
  <path d="M4 17C4.36915 17.0523 4.72159 17.1883 5.03065 17.3975C5.3397 17.6068 5.59726 17.8838 5.7838 18.2078C5.94231 18.4962 6.15601 18.7504 6.41264 18.9557C6.66927 19.161 6.96379 19.3135 7.27929 19.4043C7.59478 19.4952 7.92504 19.5226 8.25112 19.485C8.5772 19.4475 8.89268 19.3457 9.17946 19.1855" />
</svg>
      ),
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/raj_pankaj_prajapati',
      svg: (
        <svg className="w-5 h-5 fill-current text-pink-500" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      ),
    },
    {
      name: 'Gmail',
      url: 'mailto:rp5876907@gmail.com',
      svg: (
        <svg className="w-5 h-5 text-red-500" viewBox="15 40 160 120" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
  <path d="M22 57.265V142c0 5.523 4.477 10 10 10h24V95.056l40 30.278 40-30.278V152h24c5.523 0 10-4.477 10-10V57.265c0-13.233-15.15-20.746-25.684-12.736L96 81.265 47.684 44.53C37.15 36.519 22 44.032 22 57.265Z"/>
</svg>
      ),
    },
    {
      name: 'Telegram',
      url: 'https://t.me/raj_prajapati14022001',
      svg: (
        <svg className="w-5 h-5 fill-current text-blue-500" viewBox="0 0 24 24">
          <path d="M23.1117 4.49449C23.4296 2.94472 21.9074 1.65683 20.4317 2.227L2.3425 9.21601C0.694517 9.85273 0.621087 12.1572 2.22518 12.8975L6.1645 14.7157L8.03849 21.2746C8.13583 21.6153 8.40618 21.8791 8.74917 21.968C9.09216 22.0568 9.45658 21.9576 9.70712 21.707L12.5938 18.8203L16.6375 21.8531C17.8113 22.7334 19.5019 22.0922 19.7967 20.6549L23.1117 4.49449ZM3.0633 11.0816L21.1525 4.0926L17.8375 20.2531L13.1 16.6999C12.7019 16.4013 12.1448 16.4409 11.7929 16.7928L10.5565 18.0292L10.928 15.9861L18.2071 8.70703C18.5614 8.35278 18.5988 7.79106 18.2947 7.39293C17.9906 6.99479 17.4389 6.88312 17.0039 7.13168L6.95124 12.876L3.0633 11.0816ZM8.17695 14.4791L8.78333 16.6015L9.01614 15.321C9.05253 15.1209 9.14908 14.9366 9.29291 14.7928L11.5128 12.573L8.17695 14.4791Z"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com',
      svg: (
        <svg className="w-10 h-5 fill-current text-blue-600" viewBox="0 0 48 48">
  <path d="M34.094,8.688h4.756V0.005h-8.643c-0.721-0.03-9.51-0.198-11.788,8.489c-0.033,0.091-0.761,2.157-0.761,6.983l-7.903,0.024   v9.107l7.913-0.023v24.021h12.087v-24h8v-9.131h-8v-2.873C29.755,10.816,30.508,8.688,34.094,8.688z M35.755,17.474v5.131h-8v24   h-8.087V22.579l-7.913,0.023v-5.107l7.934-0.023l-0.021-1.017c-0.104-5.112,0.625-7.262,0.658-7.365   c1.966-7.482,9.473-7.106,9.795-7.086l6.729,0.002v4.683h-2.756c-4.673,0-6.338,3.054-6.338,5.912v4.873L35.755,17.474   L35.755,17.474z"/>
</svg>
      ),
    },
    {
      name: 'WhatsApp',
      url: 'https://wa.me/+916353636344',
      svg: (
        <svg className="w-5 h-5 fill-current text-green-500" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      ),
    },
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
    <footer className="mt-12 border-t border-gray-100 dark:border-slate-800 bg-gradient-to-b from-white/50 dark:from-slate-900/50 to-slate-900/50 dark:to-slate-950 backdrop-blur-sm no-print rounded-t-[3rem]">
      <div className="max-w-7xl mx-auto px-5 md:py-10 py-7">
        <div className="md:pb-8 md:pl-2 md:pr-2 flex flex-col md:flex-row justify-between items-center gap-8 border-b border-gray-100 dark:border-slate-800 mb-8">
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
              <p className="text-[10px] font-bold dark:text-blue-400 uppercase tracking-[0.2em] leading-none mb-1">
                <span className="text-blue-500">Think. </span><span className="text-green-500">Write. </span><span className="text-pink-500">Grow.</span>
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
                onClick={(e) => handleLink(e, link.url)}
                className="md:p-3 p-2 rounded-full bg-white dark:bg-slate-900 shadow-sm transition-all hover:scale-110 hover:shadow-md flex items-center justify-center"
                aria-label={link.name}
              >
                {link.svg}
              </a>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="md:text-[10px] text-[8px] font-black text-gray-700 dark:text-slate-500 uppercase tracking-[0.3em] leading-relaxed">
            &copy; {currentYear} • SoloDiary @ <span className="text-blue-600">Raj Prajapati<br/></span>All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;