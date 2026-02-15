import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ActivityEntry, Goal } from '../types';
import { Printer, FileChartColumn, FileText, TrendingUp, Award, ImageDown,  Banknote,FileCode2, BadgeCheck , EyeOff, NotebookText, ChartLine, Landmark, ExternalLink, CheckCircle2, Zap, Target, ClipboardList, Star, Clock, DatabaseBackup, Download, Upload, X, Copy, Share2, Eye, Layout, Mail, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LineGraph from './LineGraph';
import CalendarView from './CalendarView';
import { getDB } from '../db';
import MainLogo from "../assets/icons/solodiary_icon.ico";
import AndroidIcon from "../assets/icons/android.png"
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';

interface StatsViewProps {
  userName: string;
  entries: ActivityEntry[];
  goals: Goal[];
  onRefresh?: () => void;
}

const StatsView: React.FC<StatsViewProps> = ({ userName, entries, goals, onRefresh }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = [
    { v: '01', l: 'January' }, { v: '02', l: 'February' }, { v: '03', l: 'March' },
    { v: '04', l: 'April' }, { v: '05', l: 'May' }, { v: '06', l: 'June' },
    { v: '07', l: 'July' }, { v: '08', l: 'August' }, { v: '09', l: 'September' },
    { v: '10', l: 'October' }, { v: '11', l: 'November' }, { v: '12', l: 'December' }
  ];
  

  const currentYearNum = new Date().getFullYear();
  const startYear = 2025;
  const endYear = currentYearNum + 5;
  const yearsList = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  const monthLabelText = months.find(m => m.v === selectedMonth)?.l || '';

  const handleExport = async () => {
  try {
    const db = await getDB();
    const [allEntries, allGoals, allTemplates] = await Promise.all([
      db.getAll('entries'),
      db.getAll('goals'),
      db.getAll('activity_templates')
    ]);
    
    const data = {
      user: userName,
      entries: allEntries,
      goals: allGoals,
      templates: allTemplates,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      device: navigator.userAgent
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    setExportData(jsonString);
    setShowExportModal(true);
    setCopied(false);
    
    // Auto-copy on mobile for easy sharing
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setTimeout(() => handleCopy(), 500);
    }
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Please try again.');
  }
};

// ============================================
// UNIVERSAL COPY FUNCTION
// ============================================

const handleCopy = async () => {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      showCopyFeedback();
      return;
    }
    
    // Fallback for older devices
    const textArea = document.createElement('textarea');
    textArea.value = exportData;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopied(true);
      showCopyFeedback();
    } catch (err) {
      console.error('Fallback copy failed:', err);
      // Manual copy instruction
      prompt('Copy this data manually:', exportData);
    }
    
    document.body.removeChild(textArea);
  } catch (error) {
    console.error('Copy failed:', error);
    alert('Copy failed. You can manually select and copy the text.');
  }
};

const showCopyFeedback = () => {
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

// ============================================
// GMAIL SHARE - Mobile Optimized
// ============================================

const handleGmailShare = async () => {
const filename = `SoloDiary-Backup-${Date.now()}.json`;
const subject = encodeURIComponent(`SoloDiary Backup - ${userName}`);
  const body = encodeURIComponent(`Here's my SoloDiary data backup:\n\n${exportData}\n\nExported: ${new Date().toLocaleString()}`);
  
  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Save the 5,000 lines to a temporary file on the phone
      const result = await Filesystem.writeFile({
        path: filename,
        data: exportData, // Your large JSON string
        directory: Directory.Cache, // Saves to temporary cache
        encoding: 'utf8'
      });

      // 2. Share that specific file
      await Share.share({
        title: 'SoloDiary Backup',
        text: 'Here is my data backup file.',
        url: result.uri, // This is the internal file path Android understands
        dialogTitle: 'Share Backup File'
      }); 
    } else {
      // DESKTOP FALLBACK: Just download the file
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  } catch (error) {
    console.error('Big data share failed:', error);
    alert("Backup too large for direct share. Try downloading instead.");
  }
};

// ============================================
// WEB VIEW - Enhanced for Mobile
// ============================================

const handleWebView = () => {
  const formattedData = typeof exportData === 'string' 
    ? exportData 
    : JSON.stringify(exportData, null, 2);
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
        <title>SoloDiary Export - ${userName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Mono', 'Fira Code', monospace;
            padding: 16px; 
            background: #f8fafc; 
            color: #0f172a; 
            line-height: 1.6;
            font-size: 14px;
          }
          .container {
            max-width: 100%;
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid #0f172a;
          }
          .title {
            font-size: 20px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: -0.02em;
            color: #0f172a;
          }
          .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #f1f5f9;
            padding: 16px;
            border-radius: 12px;
            font-size: 12px;
            border: 1px solid #e2e8f0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .actions {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 16px;
            background: white;
            border-top: 1px solid #e2e8f0;
            display: flex;
            gap: 12px;
            justify-content: center;
            backdrop-filter: blur(10px);
          }
          .button {
            flex: 1;
            padding: 14px 20px;
            border: none;
            border-radius: 40px;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #0f172a;
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">📋 SoloDiary Archive</div>
            <div class="subtitle">${userName} • ${new Date().toLocaleString()}</div>
          </div>
          <pre>${formattedData}</pre>
        </div>
        <div class="actions">
          <button class="button" onclick="window.copyToClipboard()">Copy</button>
          <button class="button" onclick="window.print()">Print</button>
          <button class="button" onclick="window.close()">Close</button>
        </div>
        <script>
          window.copyToClipboard = function() {
            const text = ${JSON.stringify(formattedData)};
            if (navigator.clipboard) {
              navigator.clipboard.writeText(text).then(() => {
                alert('Copied!');
              });
            } else {
              const el = document.createElement('textarea');
              el.value = text;
              document.body.appendChild(el);
              el.select();
              document.execCommand('copy');
              document.body.removeChild(el);
              alert('Copied!');
            }
          };
        </script>
      </body>
    </html>
  `;
  
  // Open in new window with proper viewport for mobile
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }
};

// ============================================
// UNIVERSAL SHARE FUNCTION
// ============================================

const handleShare = async () => {
  const cleanName = userName.replace(/\s+/g, '-').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  const filename = `solodiary-export-${cleanName}-${date}.json`;
  
  // Prepare the content
  const shareTitle = `SoloDiary Export - ${userName}`;
  const shareText = `My activity and goals backup from ${new Date().toLocaleDateString()}`;

  try {
    // Check if running on Android/iOS app
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: shareTitle,
        text: exportData, // You can share the JSON string directly as text
        dialogTitle: 'Share your backup',
      });
    } else {
      // WEB STRATEGY (Your existing logic for Desktop/Chrome)
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          // Note: File sharing on web is still hit-or-miss
        });
      } else {
        handleDownload(); // Fallback for desktop browsers
      }
    }
  } catch (error) {
    console.error('Share failed:', error);
    handleDownload(); // Emergency fallback
  }
};

// ============================================
// ENHANCED DOWNLOAD FUNCTION
// ============================================
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
};

/**
 * Universal Download Function
 * Handles Web, Android, and iOS
 */

const universalDownload = async (blob, filename, mimeType) => {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      // 1. Convert Blob to Base64
      const base64Data = await blobToBase64(blob);
      
      // 2. Save file to the device's Documents folder
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data, // Includes the data:mimeType;base64, prefix
        directory: Directory.Documents,
      });

      // 3. Open the file natively so user can view/save/share it
      await FileOpener.openFile({
        path: savedFile.uri,
        mimeType: mimeType
      });
    } catch (error) {
      console.error('Native download failed:', error);
      alert('Could not save file to device.');
    }
  } else {
    // Standard Browser Download Logic
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
};

// --- Updated Export Functions ---

const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solodiary-export-${userName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };



const handleDownloadPdf = async () => {
  const element = document.getElementById('printable-report');
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
  // Important: Use .output('blob') instead of .save() for universal compatibility
  const pdfBlob = pdf.output('blob');
  await universalDownload(pdfBlob, 'SoloDiary-Transcript.pdf', 'application/pdf');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Check if running as PWA/mobile app
const isRunningAsApp = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

// Show toast/feedback (implement based on your UI library)
const showToast = (message: string) => {
  // You can integrate with your toast library here
  console.log(message);
};

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (window.confirm('This will merge the imported data with your existing records. Continue?')) {
          const db = await getDB();
          
          if (data.entries) {
            const tx = db.transaction('entries', 'readwrite');
            await Promise.all(data.entries.map((e: any) => tx.store.put(e)));
            await tx.done;
          }
          if (data.goals) {
            const tx = db.transaction('goals', 'readwrite');
            await Promise.all(data.goals.map((g: any) => tx.store.put(g)));
            await tx.done;
          }
          if (data.templates) {
            const tx = db.transaction('activity_templates', 'readwrite');
            await Promise.all(data.templates.map((t: any) => tx.store.put(t)));
            await tx.done;
          }
          
          alert('Import successful!');
          if (onRefresh) onRefresh();
        }
      } catch (err) {
        alert('Error importing data. Please check the file format.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  

  const formatDateDDMMYYYY = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const currentMonthEntries = useMemo(() => {
    return entries.filter(e => {
      const parts = e.toDate.split('-');
      return parts[0] === selectedYear && parts[1] === selectedMonth;
    }).sort((a, b) => a.toDate.localeCompare(b.toDate) || a.toTime.localeCompare(b.toTime));
  }, [entries, selectedMonth, selectedYear]);

  const reportGoals = useMemo(() => {
    return goals.filter(g => {
      const isThisMonthDeadline = g.deadlineMonth === monthLabelText && g.deadlineYear.toString() === selectedYear;
      const isThisMonthAchieved = g.achievedAt && g.achievedAt.startsWith(`${selectedYear}-${selectedMonth}`);
      return isThisMonthDeadline || isThisMonthAchieved;
    });
  }, [goals, monthLabelText, selectedYear, selectedMonth]);

  const activitySummary = useMemo(() => {
    const summaryMap: Record<string, { name: string, count: number, totalPoints: number }> = {};
    currentMonthEntries.forEach(e => {
      if (!summaryMap[e.code]) {
        summaryMap[e.code] = { name: e.name, count: 0, totalPoints: 0 };
      }
      summaryMap[e.code].count += 1;
      summaryMap[e.code].totalPoints += e.points;
    });
    return Object.entries(summaryMap).map(([code, data]) => ({
      code,
      ...data
    })).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [currentMonthEntries]);

  const userMonthPoints = useMemo(() => {
    return currentMonthEntries.reduce((s, e) => s + e.points, 0);
  }, [currentMonthEntries]);

  const daysInMonthCount = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
  const monthTargetBase = daysInMonthCount * 100;
  
  const monthProgressPct = useMemo(() => {
    if (monthTargetBase === 0) return 0;
    return (userMonthPoints / monthTargetBase) * 100;
  }, [userMonthPoints, monthTargetBase]);

    // Cumulative yearly points calculation: January until selected month
  const yearPoints = useMemo(() => {
    return entries.filter(e => {
      const parts = e.toDate.split('-');
      return parts[0] === selectedYear && parts[1] <= selectedMonth;
    }).reduce((s, e) => s + e.points, 0);
  }, [entries, selectedYear, selectedMonth]);

  // Cumulative yearly goals calculation: January until selected month
  const yearGoalsAchievedCount = useMemo(() => {
    return goals.filter(g => {
      if (!g.achievedAt) return false;
      const parts = g.achievedAt.split('-');
      return parts[0] === selectedYear && parts[1] <= selectedMonth;
    }).length;
  }, [goals, selectedYear, selectedMonth]);


  const totalDebitAmt = currentMonthEntries.reduce((s, e) => s + (e.debit || 0), 0);
  const totalCreditAmt = currentMonthEntries.reduce((s, e) => s + (e.credit || 0), 0);
  
  const groupedLogsByDate = useMemo(() => {
    const groups: Record<string, ActivityEntry[]> = {};
    currentMonthEntries.forEach(e => {
      if (!groups[e.toDate]) groups[e.toDate] = [];
      groups[e.toDate].push(e);
    });
    return groups;
  }, [currentMonthEntries]);

  const hasAttachmentsInReport = useMemo(() => currentMonthEntries.some(e => !!e.attachment), [currentMonthEntries]);
  const hasTransactionsInReport = useMemo(() => currentMonthEntries.some(e => (e.debit || 0) > 0 || (e.credit || 0) > 0), [currentMonthEntries]);

  const getGraphDataForMonth = () => {
    const data = [];
    const firstDay = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
    const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
    let current = new Date(firstDay);
    while (current <= lastDay) {
      const dStr = current.toISOString().split('T')[0];
      const pts = entries.filter(e => e.toDate === dStr).reduce((s, e) => s + e.points, 0);
      const achievedInDay = goals.filter(g => g.achievedAt === dStr);
      data.push({ 
        day: current.getDate(), 
        points: pts, 
        fullDate: dStr,
        achievedGoals: achievedInDay 
      });
      current.setDate(current.getDate() + 1);
    }
    return data;
  };

const handlePrintReport = async () => {
  const cleanName = userName.replace(/[^a-z0-9]/gi, '_');
  const fileName = `SoloDiary-${cleanName}-${selectedMonth}${selectedYear}`;
  
  // Detect mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
if (isMobile) {
  const userChoice = confirm(
    '⚠️ This PDF may be corrupted!\n\n' +
    'Please backup your JSON data and export to PC/laptop for better PDF quality, ' +
    'or use desktop mode in web browser.\n\n' +
    'Press OK to continue with PDF generation, or Cancel to abort.'
  );
  
  if (!userChoice) {
    // User clicked Cancel - abort operation
    console.log('PDF generation cancelled by user');
    return; // Exit the function
  }
}

  try {
    if (isMobile) {
      // Mobile: Generate PDF and share/print
      await generateMobilePDF(fileName);
      window.print();
    } else {
      // Desktop: Use title hack for PDF filename
      const originalTitle = document.title;
      document.title = fileName;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  } catch (error) {
    console.error('Print failed:', error);
    // Fallback
    window.print();
  }
};


// Mobile PDF Generator with html2canvas + jsPDF
const generateMobilePDF = async (fileName: string) => {
  try {
    // Load libraries dynamically if not available
    await loadPDFLibraries();
    
    const element = document.getElementById('printable-report');
    if (!element) throw new Error('Report element not found');
    
    // Show loading indicator (you can add a toast/alert)
    console.log('Generating PDF...');
    
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    const imgData = canvas.toDataURL('image/JPEG', 0.95);
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    // Try native sharing first (iOS/Android)
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: fileName,
        text: 'SoloDiary Report'
      });
    } else {
      // Fallback: Save PDF
      pdf.save(`${fileName}.pdf`);
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    // Fallback to web print
    window.print();
  }
};

// Load PDF libraries
const loadPDFLibraries = () => {
  return new Promise((resolve, reject) => {
    if (window.html2canvas && window.jspdf) {
      resolve(true);
      return;
    }
    
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded === 2) {
        setTimeout(resolve, 100);
      }
    };
    
    // html2canvas
    if (!window.html2canvas) {
      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script1.async = true;
      script1.onload = checkLoaded;
      script1.onerror = reject;
      document.head.appendChild(script1);
    } else {
      loaded++;
    }
    
    // jspdf
    if (!window.jspdf) {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script2.async = true;
      script2.onload = checkLoaded;
      script2.onerror = reject;
      document.head.appendChild(script2);
    } else {
      loaded++;
    }
  });
};

const openExternalLink = async () => {
  try {
    await Browser.open({ url: 'https://solodiary.com' });
  } catch (error) {
    window.open('https://solodiary.com', '_system');
    console.error("Browser plugin error:", error);
  }
};
const openAndroidLink = async () => {
  try {
    await Browser.open({ url: 'https://solodiary.com' });
  } catch (error) {
    window.open('https://solodiary.com', '_system');
    console.error("Browser plugin error:", error);
  }
};

const handleImageReport = async () => {
  const element = document.getElementById('printable-report');
  if (!element) {
    alert("Report element not found");
    return;
  }

  // Optional: Add a loading indicator here (e.g., setIsLoading(true))
  console.log("Generating report...");

  try {
    // 1. Capture the element with high resolution
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      scale: 3, // Increased to 3 for extra sharp text on mobile
      backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
    });

    const fileName = `SoloDiary-${userName || 'User'}-${selectedMonth}${selectedYear}.png`;

    // 2. Convert to Blob for modern Sharing/Downloading
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error("Canvas to Blob conversion failed");
        return;
      }

      const file = new File([blob], fileName, { type: 'image/png' });

      // 3. Logic for Android/iOS (Mobile Share Sheet)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'SoloDiary Report',
            text: `Check out my report for ${selectedMonth} ${selectedYear}`,
          });
          console.log("Shared successfully");
        } catch (shareError) {
          // If the user simply cancelled the share, do nothing.
          // Otherwise, try the fallback download.
          if (shareError.name !== 'AbortError') {
            console.warn("Share failed, trying download fallback", shareError);
            downloadFallback(canvas, fileName);
          }
        }
      } 
      // 4. Logic for Web/PC (Standard Download)
      else {
        downloadFallback(canvas, fileName);
      }
      
      // Optional: Remove loading indicator here
    }, 'image/png', 1.0); // 1.0 is the quality setting

  } catch (err) {
    console.error('Screenshot generation failed:', err);
    alert("Failed to generate image. Please try again.");
  }
};

/**
 * Fallback function for PC and older browsers
 */
const downloadFallback = (canvas, fileName) => {
  try {
    const image = canvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.href = image;
    link.download = fileName;
    
    // Append to body, click, and remove (cleaner approach)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Download triggered successfully");
  } catch (error) {
    console.error("Fallback download failed", error);
  }
};

const handleWebReport = async () => {
  const element = document.getElementById('printable-report');
  if (!element) return;

  // 1. Gather Styles
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('');
      } catch (e) {
        return ''; 
      }
    })
    .join('');

  // 2. Build the HTML Document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SoloDiary Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        ${styles}
        body { padding: 20px; background-color: #f3f4f6; }
      </style>
    </head>
    <body>
      ${element.outerHTML}
    </body>
    </html>
  `;

  const fileName = `SoloDiary-${userName || 'User'}-${selectedMonth}${selectedYear}.html`;

  try {
    // 3. Logic for Android (Share API)
    // We convert the HTML string into a File object
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const file = new File([blob], fileName, { type: 'text/html' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'SoloDiary HTML Report',
        });
      } catch (shareError) {
        if (shareError.name !== 'AbortError') {
          htmlDownloadFallback(htmlContent, fileName);
        }
      }
    } 
    // 4. Logic for Web/PC (Standard Blob Download)
    else {
      htmlDownloadFallback(htmlContent, fileName);
    }
  } catch (err) {
    console.error('HTML Export failed:', err);
    // Ultimate fallback
    htmlDownloadFallback(htmlContent, fileName);
  }
};

/**
 * Fallback for PC and browsers that don't support sharing HTML files
 */
const htmlDownloadFallback = (content, fileName) => {
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

 const [isDesktop, setIsDesktop] = useState(false);
 {/* Logic: Calculate the net balance */}
const netAmount = totalCreditAmt - totalDebitAmt;
const isNegative = netAmount < 0;

const [showLabels, setShowLabels] = useState(true);


  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
{/* SoloDiary Website Link Section */}
{/* SoloDiary Branding Section */}
<div className="max-w-[850px] mx-auto bg-white dark:bg-slate-900 p-2 md:p-3 rounded-2xl border border-gray-200/60 dark:border-slate-700/50 shadow-xl shadow-rose-500/5 no-print">
  <div className="flex justify-between items-center gap-3">
    
    {/* Left Side: Branding */}
    <div className="flex items-center gap-3">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-orange-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative p-2 md:p-3 bg-rose-500 rounded-xl text-white shadow-md">
          <Globe size={20} className="md:w-7 md:h-7" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className="text-base md:text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none">
          SoloDiary
        </h2>
        <p className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
          Experience the full version with enhanced performance.
        </p>
      </div>
    </div>
    
    {/* Right Side: Links */}
    <div className="flex items-center gap-2">
      {/* Android Button */}
      <button 
        onClick={openAndroidLink}
        className="group flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-2 md:px-4 md:py-2 rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
      >
        <img src={AndroidIcon} className="w-4 h-4 md:w-5 md:h-5 brightness-0 invert dark:brightness-100 dark:invert-0" alt="Android" />
        <span className="hidden md:inline">Android App</span>
      </button>

      {/* Website Button */}
      <button 
        onClick={openExternalLink}
        className="group flex items-center justify-center gap-2 bg-rose-600 text-white p-2 md:px-4 md:py-2 rounded-xl font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[10px] uppercase tracking-widest"
      >
        <span className="hidden md:inline">Visit</span> 
        <span>Website</span>
        <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  </div>
</div>





      {/* Backup Utility Section */}
<div className="max-w-[850px] mx-auto bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border border-gray-200/60 dark:border-slate-700 shadow-xl shadow-gray-200/20 dark:shadow-none no-print">
  <div className="flex items-center justify-between gap-3">
    
    {/* Left Side: Text and Icon stays exact */}
    <div className="flex items-center gap-3">
      <div className="p-2 md:p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/20">
        <DatabaseBackup size={24} className="md:w-7 md:h-7" />
      </div>
      <div className="flex flex-col">
        <h2 className="text-base md:text-lg font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-tight">
          Backup
        </h2>
        <p className="text-[9px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest leading-tight flex items-center gap-1.5">
  <span className="h-1.5 w-1.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(250,204,21,0.5)]"></span>
  JSON Storage & Restoration
</p>
      </div>
    </div>

    {/* Right Side: Buttons with mobile-hide text logic */}
    <div className="flex items-center gap-2">
      <button 
        onClick={() => fileInputRef.current?.click()} 
        className="group flex items-center justify-center gap-1.5 bg-emerald-600 text-white p-2 md:px-4 md:py-2 rounded-xl font-black shadow-sm hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[9px] uppercase tracking-widest whitespace-nowrap"
      >
        <Upload size={14} strokeWidth={2.5} /> 
        <span className="hidden md:inline">Import</span>
      </button>
      
      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
      
      <button 
        onClick={handleExport} 
        className="group flex items-center justify-center gap-1.5 bg-indigo-600 text-white p-2 md:px-4 md:py-2 rounded-xl font-black shadow-sm hover:bg-indigo-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[9px] uppercase tracking-widest whitespace-nowrap"
      >
        <Download size={14} strokeWidth={2.5} /> 
        <span className="hidden md:inline">Export</span>
      </button>
    </div>

  </div>
</div>


      {/*Test for no pop up*/}

{/* Export Utility Modal */}
      {showExportModal && (
        <div className="flex justify-center items-center">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] border border-white/20 overflow-hidden">
            <div className="md:p-8 p-2 pl-8 pr-8 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Export Portal</h2>
                <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Multi-Channel Data Sharing</p>
              </div>
              <button onClick={() => setShowExportModal(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all">
                <X size={28} className="text-gray-900 dark:text-white" />
              </button>
            </div>
            
            <div className="md:p-8 overflow-y-auto bg-gray-100 dark:bg-black/40 font-mono text-[11px] dark:text-emerald-400 scrollbar-thin scrollbar-thumb-gray-400 overflow-auto 
            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="pl-3 pr-3 p-2 md:pl-0 md:pr-0 md:p-0 flex justify-between items-center mb-4">
                 <div className="flex items-center gap-2">
                   <Eye size={14} className="opacity-60" />
                   <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Manifest Preview</span>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={handleWebView} className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-slate-200 dark:bg-slate-700 dark:text-white hover:opacity-80 transition-all">
                      <Globe size={12} /> Web View
                   </button>
                   <button onClick={handleCopy} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'}`}>
                      {copied ? <CheckCircle2 size={12}/> : <Copy size={12} />}
                      {copied ? 'Copied' : <span className="hidden md:inline">Copy</span>}
                   </button>
                 </div>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed select-all md:p-4 p-2 bg-white/5 md:rounded-xl border border-black/5 dark:border-white/5">{exportData}</pre>
            </div>
            
            <div className="md:p-8 p-5 border-t border-gray-100 dark:border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/50 dark:bg-slate-800/50">
              <button onClick={handleDownload} className="px-6 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all">
                <Download size={20} /> JSON
              </button>
              <button onClick={handleShare} className="px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all">
                <Share2 size={20} /> Share
              </button>
              <button onClick={handleGmailShare} className="px-6 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all">
                <Mail size={20} /> Gmail
              </button>
              <button onClick={() => setShowExportModal(false)} className="px-6 py-4 bg-gray-400 dark:bg-slate-700 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px] hover:opacity-80 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Report Control Section */}
<div className="max-w-[850px] mx-auto bg-white dark:bg-slate-900 p-3 md:p-4 rounded-2xl border border-gray-200/60 dark:border-slate-700/50 shadow-xl shadow-gray-200/20 dark:shadow-none no-print">
  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
    
    {/* Left Side: Branding */}
    <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
          <FileText size={24} strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col">
        <h2 className="text-[15px] md:text-lg font-black leading-tight uppercase tracking-tight text-slate-800 dark:text-slate-100">
          Report Audit
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(250,204,21,0.5)]"></span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generate PDF Transcripts</p>
        </div>
      </div>
    </div>

    {/* Right Side: Controls Wrapper */}
    <div className="flex flex-row flex-wrap md:flex-nowrap items-center justify-center gap-2 md:gap-4 w-full md:w-auto">
      
      {/* Selection Group: With subtle background tray */}
      <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
        <select 
          value={selectedMonth} 
          onChange={e => setSelectedMonth(e.target.value)} 
          className="bg-transparent pl-2 pr-1 py-1.5 text-slate-700 dark:text-slate-200 font-bold outline-none text-[11px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {months.map(m => <option key={m.v} value={m.v} className="dark:bg-slate-900">{m.l}</option>)}
        </select>
        
        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700"></div>

        <select 
          value={selectedYear} 
          onChange={e => setSelectedYear(e.target.value)} 
          className="bg-transparent pl-1 pr-2 py-1.5 text-slate-700 dark:text-slate-200 font-bold outline-none text-[11px] cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {yearsList.map(y => (
            <option key={y} value={y.toString()} className="dark:bg-slate-900">{y}</option>
          ))}
        </select>
      </div>

      {/* Button Group */}
      <div className="flex items-center gap-2">
        <button 
          onClick={handlePrintReport} 
          className="group flex items-center justify-center gap-2 bg-blue-600 text-white p-2.5 md:px-4 md:py-2 rounded-xl font-bold shadow-lg shadow-blue-500/10 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
        >
          <Printer size={16} className="group-hover:rotate-12 transition-transform" /> 
          <span className="hidden md:inline">PDF Report</span>
        </button>

        <button 
          onClick={handleImageReport} 
          className="group flex items-center justify-center gap-2 bg-green-600 text-white p-2.5 md:px-4 md:py-2 rounded-xl font-bold shadow-lg shadow-green-500/10 hover:bg-green-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
        >
          <ImageDown size={16} className="group-hover:rotate-12 transition-transform"/> 
          <span className="hidden md:inline">PNG</span>
        </button>

        <button 
          onClick={handleWebReport} 
          className="group flex items-center justify-center gap-2 bg-pink-600 text-white p-2.5 md:px-4 md:py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-pink-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
        >
          <FileCode2 size={16} className="group-hover:rotate-12 transition-transform"/> 
          <span className="hidden md:inline">HTML</span>
        </button>
      </div>
    </div>
  </div>
</div>


      {/*Andorid Web View Report*/}
      
      
      <div className="lg:hidden max-w-[850px] mx-auto justify-items-center text-2xl bg-white dark:bg-slate-800 rounded-xl border-0 border-gray-100 dark:border-slate-700 shadow-sm no-print justify-items-center">
      {/* 1. Normal Button to trigger the view */}
      
      <button 
        onClick={() => setIsDesktop(true)}
        className="flex items-center justify-center gap-2 h-40 w-full m-0 bg-[linear-gradient(45deg,rgb(251,202,136),rgb(239,105,173))] text-white dark:text-black p-2 rounded-xl transition-transform duration-300 hover:scale-[1.02] hover:brightness-110 cursor-pointer"
      ><FileChartColumn size={30}/>
        View PDF Report
      </button>
      </div>

<div className={isDesktop ? "desktop-view-active" : ""}>
      {/* 2. Close Button (Only shows in Desktop Mode) */}
      {isDesktop && (
        <button 
          onClick={() => setIsDesktop(false)}
          className="close-desktop-btn"
        >
          <X size={20} />
        </button>
        )}


      {/* PRINTABLE TRANSCRIPT AREA */}
      <div 
  id="printable-report" 
  className="font-variant-ligatures: none; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; bg-white p-10 text-slate-900 min-h-[297mm] w-[210mm] flex flex-col mx-auto shadow-lg border border-slate-100 rounded-none md:rounded-xl overflow-hidden print:p-0 print:m-0 print:border-none print:shadow-none"
>
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-[3px] border-slate-950 pb-4 mb-6">
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-slate-950 flex items-center justify-center rounded-full shadow-lg border-2 border-slate-200 overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-left space-y-0.5">
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-900">
                PRINCIPAL: {userName.toUpperCase()}
              </p>
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-blue-600">
                PERIOD: {monthLabelText} {selectedYear}
              </p>
              <p className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">
                ISSUED: {new Date().toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }).replace(',', '').toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none mb-0.5">SOLODIARY</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
              <span className="text-blue-500">Think.</span>{' '}
              <span className="text-green-500">Write.</span>{' '}
              <span className="text-pink-500">Grow.</span>
              </p>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Where your stories stay yours</p>
            </div>
            {/* Round Logo */}
            <div className="w-[55px] h-[55px] bg-slate-950 flex items-center justify-center rounded-full shadow-lg border-2 border-slate-200 overflow-hidden">
               <img src={MainLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Overview Module */}
        <div className="mb-8 print-section">
           <div className="flex justify-between items-end mb-4">
              <div className="space-y-0.5">
                <p className="text-base font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  {monthLabelText} ({selectedYear}) Overview
                  <TrendingUp size={16} className="text-blue-600" />
                </p>
                <h3 className="text-4xl font-black text-slate-900 leading-none tracking-tighter">
                  {userMonthPoints.toLocaleString()} / <span className="text-slate-300">{monthTargetBase.toLocaleString()}</span>
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Points Earned <span className="text-black font-bold">vs</span> Monthly Baseline</p>
              </div>

              <div className="flex gap-2">
                 <div className="bg-slate-950 text-white px-5 py-3 rounded-xl flex flex-col items-center justify-center min-w-[100px] shadow-sm">
                    <span className="text-2xl font-black leading-none">{monthProgressPct.toFixed(1)}%</span>
                    <span className="text-[7px] uppercase font-black opacity-60 mt-1 tracking-widest">Efficiency</span>
                 </div>
                 <div className="border-[2px] border-slate-950 text-slate-950 px-5 py-3 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
                    <span className="text-2xl font-black leading-none">{userMonthPoints}</span>
                    <span className="text-[7px] uppercase font-black opacity-40 mt-1 tracking-widest">Points</span>
                 </div>
              </div>
           </div>

           <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div className="h-full bg-gradient-to-r from-slate-950 to-blue-700 rounded-full transition-all duration-1000" style={{ width: `${Math.min(monthProgressPct, 100)}%` }} />
           </div>
        </div>

        {/* Data Matrix Module */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 mb-8 items-start print-section">
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
             <CalendarView 
                key={`${selectedYear}-${selectedMonth}`}
                entries={entries} 
                goals={goals} 
                selectedDate={`${selectedYear}-${selectedMonth}-01`} 
                onSelectDate={() => {}} 
             />
          </div>
          <div className="space-y-3 flex flex-col h-full">
            <div className="p-5 border-[2px] border-slate-950 rounded-xl bg-white flex flex-col justify-center relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-slate-900">
                <Zap size={40} />
              </div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">Month Net Yield</p>
              <p className="text-3xl font-black text-slate-950 tracking-tighter">{userMonthPoints.toLocaleString()} PTS</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">
                  <Award size={10} className="text-blue-500 inline mr-1" /> Yearly Points
                </p>
                <p className="text-lg font-black text-slate-950">{yearPoints.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
                <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5 tracking-widest">
                  <Target size={10} className="text-purple-500 inline mr-1" /> Yearly Goals
                </p>
                <p className="text-lg font-black text-slate-950">{yearGoalsAchievedCount}</p>
              </div>
            </div>

            <div className="space-y-3">
    {/* Dynamic Top Card */}
    <div className={`p-5 border-[2px] rounded-xl bg-white flex flex-col justify-center relative overflow-hidden group shadow-sm transition-colors duration-300 ${
      isNegative ? 'border-red-500' : 'border-emerald-500'
    }`}>
      <div className={`absolute top-0 right-0 p-2 opacity-10 ${isNegative ? 'text-red-900' : 'text-emerald-900'}`}>
        <Landmark size={40} />
      </div>
      
      <p className={`text-[9px] font-black uppercase mb-0.5 tracking-widest ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
        Month Net Amount
      </p>
      
      <p className={`text-3xl font-black tracking-tighter ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
        {isNegative ? '- ' : '+ '} ₹{Math.abs(netAmount).toLocaleString()}
      </p>
    </div>

    {/* Bottom Grid */}
    <div className="grid grid-cols-2 gap-3">
      <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg flex flex-col justify-between">
         <p className="text-[8px] font-black uppercase text-red-500 mb-0.5 tracking-widest">
           <Banknote size={10} className="inline mr-1" /> Debit
         </p>
         <p className="text-lg font-black text-red-600">₹{totalDebitAmt.toLocaleString()}</p>
      </div>
      
      <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg flex flex-col justify-between">
         <p className="text-[8px] font-black uppercase text-emerald-600 mb-0.5 tracking-widest">
           <Banknote size={10} className="inline mr-1" /> Credit
         </p>
         <p className="text-lg font-black text-emerald-600">₹{totalCreditAmt.toLocaleString()}</p>
      </div>
    </div>
  </div>

          </div>
        </div>

        {/* Trajectory Module - Monthly Variance Projection*/}
        <h3 className="text-sm font-black uppercase tracking-tighter text-slate-950 mb-3 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
             <ChartLine size={16} strokeWidth={3} className="text-purple-600" /> 
             Monthly Variance Projection
           </h3>

        
  <div className="mb-8 border border-slate-100 py-2 rounded-xl bg-slate-50/50 print-section relative">
    {/* Header Container */}
    <div className="flex items-center justify-between px-4 mb-4">
      
      {/* 1. Left Spacer (Empty div to balance the button) */}
      <div className="w-8" /> 

      {/* 2. Centered Title */}
      <h4 className="flex-1 text-[8px] font-black text-center uppercase tracking-[0.3em] text-slate-400">
        Yield Trajectory ({monthLabelText} {selectedYear})
      </h4>

      {/* 3. Right Button */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          setShowLabels(!showLabels);
        }}
        className="w-8 flex justify-end text-slate-400 hover:text-blue-500 transition-colors"
        title={showLabels ? "Hide Labels" : "Show Labels"}
      >
        {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>

    {/* Graph Container */}
    <div className="w-full">
      <LineGraph 
        data={getGraphDataForMonth()} 
        monthName={monthLabelText} 
        showGoalNames={showLabels} 
      />
    </div>
</div>

        {/* Goal Ledger Module "text-purple-600"*/}
        <div className="mb-8 print-section">
           <h3 className="text-sm font-black uppercase tracking-tighter text-slate-950 mb-3 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
             <Target size={16} className="text-green-600" />
             Strategic Objectives
           </h3>
           <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white border-b border-slate-950">
                    <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest">ID</th>
                    <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest">Golas List</th>
                    <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest text-center">Value</th>
                    <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportGoals.sort((a,b) => (a.achievedAt ? 1 : -1)).map(g => (
                    <tr key={g.id} className={g.achievedAt ? 'bg-emerald-50/20' : 'bg-white'}>
                      <td className={`px-4 py-2 font-black text-[9px] text-blue-600 ${g.achievedAt ? 'line-through opacity-30' : ''}`}>{g.code}</td>
                      <td className={`px-4 py-2 font-bold text-[9px] text-slate-950 ${g.achievedAt ? 'line-through opacity-30' : ''}`}>{g.name}</td>
                      <td className={`px-4 py-2 font-black text-[9px] text-slate-950 text-center ${g.achievedAt ? 'line-through opacity-30' : ''}`}>+{g.points}</td>
                      <td className="px-4 py-2 text-right">
                         {g.achievedAt ? (
                           <div className="flex flex-col items-end leading-none">
                              <span className="text-emerald-700 font-black text-[7px] tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200 uppercase flex items-center gap-1">
                                <CheckCircle2 size={8} /> DONE
                              </span>
                              <span className="text-[6px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">{formatDateDDMMYYYY(g.achievedAt)}</span>
                           </div>
                         ) : (
                           <span className="text-red-500 font-black text-[7px] tracking-widest uppercase inline-flex items-center gap-0.5">
                            <Clock size={8} className="text-red-500" />
                            PENDING
                          </span>
                         )}
                      </td>
                    </tr>
                  ))}
                  {reportGoals.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-[9px] font-bold text-slate-300 italic">No objectives recorded.</td></tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>

        {/* Matrix */}
        <div className="mb-8 print-section">
           <h3 className="text-sm font-black uppercase tracking-tighter text-slate-950 mb-3 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
             <Zap size={16} className="text-blue-600" />
             Participation Matrix
           </h3>
           <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
              {activitySummary.map(item => (
                <div key={item.code} className="p-2 border border-slate-100 rounded-lg bg-white flex flex-col justify-between min-h-[60px] shadow-sm hover:border-blue-200 transition-colors">
                   <div className="flex justify-between items-start mb-0.5">
                      <span className="text-[7px] font-black text-blue-600 uppercase bg-blue-50 px-1 py-0.25 rounded border border-blue-100">{item.code}</span>
                      <span className="text-[10px] font-black text-slate-950">+{item.totalPoints}</span>
                   </div>
                   <div>
                      <p className="text-[9px] font-bold text-slate-950 uppercase truncate mb-0.25">{item.name}</p>
                      <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Logs: {item.count}</p>
                   </div>
                </div>
              ))}
              {activitySummary.length === 0 && (
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm col-span-full p-6 text-center text-[9px] font-bold text-slate-300 italic">No summary data.</div>
              )}
           </div>
        </div>

        {/* Detailed Ledger */}
        <div className="mb-8 print-section">
  <h3 className="text-sm font-black uppercase tracking-tighter text-slate-950 mb-3 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
    <NotebookText size={16} className="text-pink-600" />
    Chronological Log Diary
  </h3>
  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
    <table className="w-full text-left border-collapse">
      <thead className="table-header-group">
        <tr className="bg-slate-950 text-white">
          <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest w-24">Timestamp</th>
          <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest w-12 text-center">Code</th>
          <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest">Entry Details</th>
          {hasAttachmentsInReport && <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest w-12 text-center">QR</th> }
          {hasTransactionsInReport && <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest w-16 text-right">Account</th>}
           <th className="px-4 py-2 text-[7px] font-black uppercase tracking-widest text-center w-14">Pts</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {Object.keys(groupedLogsByDate).length === 0 ? (
          <tr>
            <td colSpan={6} className="p-6 text-center text-[9px] font-bold text-slate-300 italic">
              No records found.
            </td>
          </tr>
        ) : (
          Object.keys(groupedLogsByDate).sort().map((dateStr) => {
            const dayPts = groupedLogsByDate[dateStr].reduce((s, e) => s + e.points, 0);
            const achievedGoalsToday = goals.filter(g => g.achievedAt === dateStr);
            return (
              <React.Fragment key={dateStr}>
                <tr className="bg-slate-100/50 border-y border-slate-100">
                  <td colSpan={6} className="px-4 py-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-950 tracking-[0.05em] uppercase flex items-center gap-2">
                        <Clock size={10} className="text-blue-500" />
                        {new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {achievedGoalsToday.length > 0 && <Star size={10} className="text-amber-500 fill-amber-500" />}
                      </span>
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest px-1.5 py-0.25 rounded bg-white border border-slate-100">
                        DAY YIELD: <span className="text-slate-950">{dayPts} PTS</span>
                      </span>
                    </div>
                  </td>
                </tr>
                {groupedLogsByDate[dateStr].map(e => (
                  <tr key={e.id} className="align-top hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 text-[8px] font-black text-slate-900 whitespace-nowrap leading-tight">
                      {e.fromTime && e.isLongEvent ? (
  <>
    {e.fromTime} <span className="text-gray-600/75">To</span> {e.toTime}
  </>
) : (
  e.toTime
)}
                    </td>
                    <td className="px-0 py-0 text-center">
                      <span className="text-[7px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{e.code}</span>
                    </td>
                    <td className="px-1.5 py-0.5">
                      <p className="text-[10px] font-black leading-tight text-slate-950 mb-1 uppercase tracking-tighter flex items-center gap-1">
                        {goals.some(g => g.code === e.code && g.achievedAt === e.toDate) && <Star size={8} className="text-amber-500 fill-amber-500" />}
                        {e.name}
                      </p>
                      {e.description && (
                        <p className="text-[8px] text-slate-600 leading-normal italic whitespace-pre-wrap border-l border-slate-200 pl-2 mt-1">
                          {e.description}
                        </p>
                      )}
                    </td>
                    
                    
                    {hasAttachmentsInReport && (
                      <td className="px-0.5 py-0.5 text-center">
                        {e.attachment ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <QRCodeSVG value={e.attachment} size={40} level="M" />
                          </div>
                        ) : null}
                      </td>
                    )}
                    {hasTransactionsInReport && (
                      <td className="px-4 py-2 text-[8px] font-black whitespace-nowrap text-right">
                        {e.debit! > 0 && <span className="text-red-600">-{e.debit}₹</span>}
                        {e.credit! > 0 && <span className="text-emerald-600 ml-1">+{e.credit}₹</span>}
                      </td>
                    )}
                    <td className="px-4 py-2 text-center text-[10px] font-black text-slate-950">+{e.points}</td>
                  </tr>
                ))}
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>
  </div>
</div>

        {/* Footer Module */}
        <div className="mt-auto pt-3 border-t-2 border-slate-900 flex items-center justify-between gap-6 print-section">
      
      {/* LEFT: Official Credentials */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          {/* Icon using Emerald for 'Verified' status */}
          <div className="flex items-center justify-center">
            <BadgeCheck size={20} strokeWidth={2.5} className="text-emerald-400" />
          </div>
          <div>
            <p className="m-0 text-[7px] font-bold text-slate-500 uppercase tracking-widest">
              SoloDiary • EST 2026
            </p>
            <h4 className="m-0 text-[10px] font-black uppercase tracking-tight text-slate-900 leading-none">
              Verified Transcript
            </h4>
          </div>
        </div>

        {/* Legal/Verification Text */}
        <p className="text-[7.5px] text-slate-600 leading-relaxed m-0 border-l-2 border-slate-200 pl-2 italic">
          This SoloDiary report for {userName.toUpperCase()} is a verified digital record. Scan the official QR code to visit our platform to initialize your own secure system archive.
        </p>
        
        {/* Signature Line */}
        <div className="pt-1 flex items-center gap-1">
          <span className="text-[7px] font-black text-slate-900 uppercase">Authorized Signatory:</span>
          <span className="text-[8px] font-medium text-slate-700 border-b border-slate-300 px-2 min-w-[80px]">
            {userName.toUpperCase()}
          </span>
        </div>
      </div>

      {/* RIGHT: Functional QR Code */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="p-1 bg-white border border-slate-200 rounded-sm shadow-sm">
          <QRCodeSVG 
            value="https://solodiary.com"
            size={54} 
            level="M" 
            includeMargin={false}
            imageSettings={{
              src: "https://solodiary.com",
              height: 10,
              width: 10,
              excavate: true,
            }}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Scan to Visit</span>
          <span className="text-[5px] font-bold text-slate-300 lowercase">solodiary.com</span>
        </div>
      </div>

    </div>
        <span className="text-[6px] font-bold text-slate-300 text-center">&copy; {currentYearNum} • <span className="text-green-300">SoloDiary</span> @ <span className="text-blue-300">Raj Prajapati</span></span>
      </div>

</div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-report { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 10mm !important; 
            margin: 0 !important;
            width: 210mm !important;
            max-width: none !important;
            min-height: 297mm !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            font-size: 85% !important;
          }
          .print-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead.table-header-group { display: table-header-group !important; }
          @page { 
            margin: 0; 
            size: A4;
          }
          tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
        }
      `}</style>
    </div>
  );
};

export default StatsView;