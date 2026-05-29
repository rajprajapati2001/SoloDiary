import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ActivityEntry, Goal } from '../types';
import { Printer, FileChartColumn, FileText, TrendingUp, Award, ImageDown,  Banknote,FileCode2, BadgeCheck , EyeOff, NotebookText, ChartLine, Landmark, ExternalLink, CheckCircle2, Zap, Target, ClipboardList, Star, Clock, DatabaseBackup, Download, Upload, X, Copy, Share2, Eye, Layout, Mail, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LineGraph from './LineGraph';
import CalendarView from './CalendarView';
import { getDB } from '../db';
import MainLogo from "../assets/icons/solodiary_icon.ico";
import AndroidIcon from "../assets/icons/android.png"
// html2canvas and jsPDF are loaded dynamically when needed
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';

interface StatsViewProps {
  userName: string;
  entries: ActivityEntry[];
  goals: Goal[];
  onRefresh?: () => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

const StatsView: React.FC<StatsViewProps> = ({ userName, entries, goals, onRefresh, onFullscreenChange }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0');
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear().toString());
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    const [allEntries, allGoals, allTemplates, allAutoTemplates] = await Promise.all([
      db.getAll('entries'),
      db.getAll('goals'),
      db.getAll('activity_templates'),
      db.getAll('auto_templates'),
    ]);
    
    const data = {
      user: userName,
      entries: allEntries,
      goals: allGoals,
      templates: allTemplates,
      autoTemplates: allAutoTemplates,
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
        encoding: Encoding.UTF8
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
  // 1. Generate HTML for the Activity Matrix
  const matrixHtml = activitySummary.map(item => `
    <div class="matrix-card" data-code="${item.code}" onclick="toggleHighlight('${item.code}')">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <span class="code-badge" style="font-size: 7px; font-weight: 900; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #dbeafe; text-transform: uppercase;">${item.code}</span>
        <span style="font-size: 10px; font-weight: 900;">+${item.totalPoints}</span>
      </div>
      <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-top: 4px;">${item.name}</div>
      <div style="font-size: 7px; color: #64748b; font-weight: 900; margin-top: 2px;">LOGS: ${item.count}</div>
    </div>
  `).join('');

  // 2. Generate HTML for the Chronological Table
  const tableBodyHtml = Object.keys(filteredGroupedLogsByDate).sort().map(dateStr => {
    const dayLogs = groupedLogsByDate[dateStr];
    const dayRows = dayLogs.map(log => `
      <tr class="log-row" data-code="${log.code}" data-debit="${log.debit || 0}" data-credit="${log.credit || 0}">
        <td style="padding: 8px; font-size: 8px; font-weight: 900; white-space: nowrap;">${log.toTime}</td>
        <td style="padding: 8px; text-align: center;">
          <span class="code-badge" style="font-size: 7px; font-weight: 900; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #dbeafe; text-transform: uppercase;">${log.code}</span>
        </td>
        <td style="padding: 8px;">
          <div style="font-size: 10px; font-weight: 900; text-transform: uppercase;">${log.name}</div>
          ${log.description ? `<div style="font-size: 8px; color: #64748b; margin-top: 2px; font-weight: 900;">${log.description}</div>` : ''}
        </td>
        <td style="padding: 8px; text-align: center; font-size: 10px; font-weight: 900;">+${log.points}</td>
      </tr>
    `).join('');

    const formattedDate = new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', weekday: 'short'
    });

    return `
      <tr style="background: #f1f5f9; border-top: 1px solid #e2e8f0;">
        <td colspan="4" style="padding: 6px 12px; font-size: 10px; font-weight: 900; color: #0f172a;">
          📅 ${formattedDate.toUpperCase()}
        </td>
      </tr>
      ${dayRows}
    `;
  }).join('');

  // 3. Complete Document Structure
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SoloDiary Report - ${userName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: sans-serif; padding: 16px; background: #f8fafc; color: #0f172a; line-height: 1.5; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { margin-bottom: 24px; border-bottom: 3px solid #0f172a; padding-bottom: 12px; }

        /* Matrix Grid */
        .matrix-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin-bottom: 30px; }
        .matrix-card { padding: 10px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; cursor: pointer; transition: all 0.2s ease; }
        .matrix-card.active { border: 2px solid #2563eb !important; background: #eff6ff !important; transform: translateY(-2px); }

        /* Table Styling */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .log-row { border-bottom: 1px solid #f1f5f9; transition: all 0.3s ease; border-left: 4px solid transparent; }
        .log-row.highlighted { background: #fffbeb !important; border-left-color: #f59e0b !important; }

        .code-badge { font-size: 7px; font-weight: 900; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #dbeafe; text-transform: uppercase; }

        .actions { position: fixed; bottom: 0; left: 0; right: 0; padding: 16px; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); display: flex; gap: 12px; border-top: 1px solid #e2e8f0; }
        .button { flex: 1; padding: 14px; border: none; border-radius: 40px; font-weight: 800; background: #0f172a; color: white; cursor: pointer; text-transform: uppercase; font-size: 12px; }

        @media print {
          .actions { display: none !important; }
          body { padding: 0; background: white; }
          .container { box-shadow: none; border: none; width: 100%; max-width: 100%; }
          .matrix-card { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px;">📋 SoloDiary Report</h1>
          <p style="font-size: 12px; color: #64748b; font-weight: 600;">${userName} • ${new Date().toLocaleString()}</p>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
          <button class="finance-btn" onclick="toggleFinanceHighlight('net')" style="border-color: ${isNegative ? '#fca5a5' : '#6ee7b7'};">💰 Net: ${isNegative ? '-' : '+'} ₹${Math.abs(netAmount).toLocaleString()}</button>
          <button class="finance-btn" onclick="toggleFinanceHighlight('debit')" style="border-color: #fca5a5; color: #dc2626;">🔴 Debit: ₹${totalDebitAmt.toLocaleString()}</button>
          <button class="finance-btn" onclick="toggleFinanceHighlight('credit')" style="border-color: #6ee7b7; color: #059669;">🟢 Credit: ₹${totalCreditAmt.toLocaleString()}</button>
        </div>

        <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #475569;">Activity Breakdown</h3>
        <div class="matrix-grid">${matrixHtml}</div>

        <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; color: #475569;">Daily Ledger</h3>
        <table>
          <thead>
            <tr style="background: #0f172a; color: white; font-size: 9px; text-transform: uppercase;">
              <th style="padding: 10px; text-align: left;">Time</th>
              <th style="padding: 10px; text-align: center;">Code</th>
              <th style="padding: 10px; text-align: left;">Details</th>
              <th style="padding: 10px; text-align: center;">Points</th>
            </tr>
          </thead>
          <tbody>${tableBodyHtml}</tbody>
        </table>
        <div style="height: 100px;"></div>
      </div>

      <div class="actions">
        <button class="button" style="background: #2563eb;" onclick="window.print()">Print PDF</button>
        <button class="button" onclick="window.close()">Close</button>
      </div>

      <script>
        window.toggleHighlight = function(code) {
          var cards = document.querySelectorAll('.matrix-card');
          var rows = document.querySelectorAll('.log-row');
          var selectedCard = document.querySelector('.matrix-card[data-code="' + code + '"]');
          document.querySelectorAll('.finance-btn').forEach(function(b) { b.classList.remove('active'); });

          if (!selectedCard) return;
          var isAlreadyActive = selectedCard.classList.contains('active');

          cards.forEach(function(c) { c.classList.remove('active'); });
          rows.forEach(function(r) { r.classList.remove('highlighted'); });

          if (!isAlreadyActive) {
            document.querySelectorAll('.matrix-card[data-code="' + code + '"]').forEach(function(c) { c.classList.add('active'); });
            document.querySelectorAll('.log-row[data-code="' + code + '"]').forEach(function(r) { r.classList.add('highlighted'); });
            var firstMatch = document.querySelector('.log-row[data-code="' + code + '"]');
            if (firstMatch) firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };

        window.toggleFinanceHighlight = function(mode) {
          var btns = document.querySelectorAll('.finance-btn');
          var rows = document.querySelectorAll('.log-row');
          var cards = document.querySelectorAll('.matrix-card');
          var clickedBtn = null;
          btns.forEach(function(b) {
            if ((mode === 'net' && b.textContent.indexOf('Net') !== -1) ||
                (mode === 'debit' && b.textContent.indexOf('Debit') !== -1) ||
                (mode === 'credit' && b.textContent.indexOf('Credit') !== -1)) {
              clickedBtn = b;
            }
          });
          var isActive = clickedBtn && clickedBtn.classList.contains('active');
          btns.forEach(function(b) { b.classList.remove('active'); });
          rows.forEach(function(r) { r.classList.remove('highlighted'); });
          cards.forEach(function(c) { c.classList.remove('active'); });
          if (!isActive) {
            if (clickedBtn) clickedBtn.classList.add('active');
            var highlightedCodes = new Set();
            rows.forEach(function(r) {
              var debit = parseFloat(r.getAttribute('data-debit') || '0');
              var credit = parseFloat(r.getAttribute('data-credit') || '0');
              var match = false;
              if (mode === 'net') match = debit > 0 || credit > 0;
              else if (mode === 'debit') match = debit > 0;
              else if (mode === 'credit') match = credit > 0;
              if (match) {
                r.classList.add('highlighted');
                highlightedCodes.add(r.getAttribute('data-code'));
              }
            });
            cards.forEach(function(c) {
              if (highlightedCodes.has(c.getAttribute('data-code'))) c.classList.add('active');
            });
            var first = document.querySelector('.log-row.highlighted');
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };
      </script>
    </body>
    </html>
  `;

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
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result as string);
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

const handleDownload = async () => {
    const fileName = `solodiary-export-${userName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([exportData], { type: 'application/json' });
    await universalDownload(blob, fileName, 'application/json');
  };



const handleDownloadPdf = async () => {
  const element = document.getElementById('printable-report');
  if (!element) return;

  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');
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
          if (data.autoTemplates) {
            const tx = db.transaction('auto_templates', 'readwrite');
            await Promise.all(data.autoTemplates.map((t: any) => tx.store.put(t)));
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

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    const element = document.getElementById(`ledger-date-${dateStr}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      element.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
      setTimeout(() => {
        element.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
      }, 2000);
    }
  };

  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const [financeHighlight, setFinanceHighlight] = useState<'net' | 'debit' | 'credit' | 'goals' | null>(null);

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

  const filteredGroupedLogsByDate = useMemo(() => {
  if (!searchQuery.trim()) return groupedLogsByDate;
  const q = searchQuery.toLowerCase();
  const result: Record<string, ActivityEntry[]> = {};
  Object.keys(groupedLogsByDate).forEach(dateStr => {
    const matched = groupedLogsByDate[dateStr].filter(e =>
      e.description?.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
    );
    if (matched.length > 0) result[dateStr] = matched;
  });
  return result;
}, [groupedLogsByDate, searchQuery]);

  const hasAttachmentsInReport = useMemo(() => currentMonthEntries.some(e => !!e.attachment), [currentMonthEntries]);
  const hasTransactionsInReport = useMemo(() => currentMonthEntries.some(e => (e.debit || 0) > 0 || (e.credit || 0) > 0), [currentMonthEntries]);

  const debitCodes = useMemo(() => {
    const codes = new Set<string>();
    currentMonthEntries.forEach(e => { if ((e.debit || 0) > 0) codes.add(e.code); });
    return codes;
  }, [currentMonthEntries]);

  const creditCodes = useMemo(() => {
    const codes = new Set<string>();
    currentMonthEntries.forEach(e => { if ((e.credit || 0) > 0) codes.add(e.code); });
    return codes;
  }, [currentMonthEntries]);

  const goalCodes = useMemo(() => new Set(reportGoals.map(g => g.code)), [reportGoals]);

  const isEntryFinanceHighlighted = (entry: ActivityEntry) => {
    if (!financeHighlight) return false;
    switch (financeHighlight) {
      case 'net': return (entry.debit || 0) > 0 || (entry.credit || 0) > 0;
      case 'debit': return (entry.debit || 0) > 0;
      case 'credit': return (entry.credit || 0) > 0;
      case 'goals': return goalCodes.has(entry.code);
      default: return false;
    }
  };

  const isCodeFinanceHighlighted = (code: string) => {
    if (!financeHighlight) return false;
    switch (financeHighlight) {
      case 'net': return debitCodes.has(code) || creditCodes.has(code);
      case 'debit': return debitCodes.has(code);
      case 'credit': return creditCodes.has(code);
      case 'goals': return goalCodes.has(code);
      default: return false;
    }
  };

  const isGoalFinanceHighlighted = (goal: Goal) => {
    if (!financeHighlight) return false;
    switch (financeHighlight) {
      case 'net': return debitCodes.has(goal.code) || creditCodes.has(goal.code);
      case 'debit': return debitCodes.has(goal.code);
      case 'credit': return creditCodes.has(goal.code);
      case 'goals': return true;
      default: return false;
    }
  };

  const handleFinanceToggle = (mode: 'net' | 'debit' | 'credit' | 'goals') => {
    const newMode = financeHighlight === mode ? null : mode;
    setFinanceHighlight(newMode);
    setHighlightedCode(null);
    if (newMode) {
      setTimeout(() => {
        const el = document.getElementById('strategic-objectives');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

const getGraphDataForMonth = () => {
  const data = [];
  // Note: month is 0-indexed in Date constructor (Jan = 0)
  const firstDay = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
  const lastDay = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0);
  
  let current = new Date(firstDay);
  
  while (current <= lastDay) {
    // FIX: Generate YYYY-MM-DD using local methods
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dStr = `${year}-${month}-${day}`;

    // Now dStr will correctly be "2024-03-01" regardless of timezone
    const pts = entries
      .filter(e => e.toDate === dStr)
      .reduce((s, e) => s + e.points, 0);
      
    const achievedInDay = goals.filter(g => g.achievedAt === dStr);

    data.push({ 
      day: current.getDate(), 
      points: pts, 
      fullDate: dStr,
      achievedGoals: achievedInDay 
    });

    // Advance to the next day locally
    current.setDate(current.getDate() + 1);
  }
  return data;
};

const handlePrintReport = async () => {
  const cleanName = userName.replace(/[^a-z0-9]/gi, '_');
  const fileName = `SoloDiary-${cleanName}-${selectedMonth}${selectedYear}`;
  
  // Android APK: Generate PDF, save to filesystem, open with system viewer
  if (Capacitor.isNativePlatform()) {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const element = document.getElementById('printable-report');
      if (!element) { alert('Report element not found'); return; }

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
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

      const pdfBlob = pdf.output('blob');
      const base64Data = await blobToBase64(pdfBlob);

      const savedFile = await Filesystem.writeFile({
        path: `${fileName}.pdf`,
        data: base64Data as string,
        directory: Directory.Documents,
      });

      await FileOpener.openFile({
        path: savedFile.uri,
        mimeType: 'application/pdf'
      });
    } catch (error) {
      console.error('Android PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    }
    return;
  }

  // Web: Use browser print with title hack for PDF filename
  try {
    const originalTitle = document.title;
    document.title = fileName;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  } catch (error) {
    console.error('Print failed:', error);
    window.print();
  }
};


// Mobile PDF Generator with html2canvas + jsPDF
const generateMobilePDF = async (fileName: string) => {
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);
    
    const element = document.getElementById('printable-report');
    if (!element) throw new Error('Report element not found');
    
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
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    
    const pdfBlob = pdf.output('blob');
    const pdfFile = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });
    
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile],
        title: fileName,
        text: 'SoloDiary Report'
      });
    } else {
      pdf.save(`${fileName}.pdf`);
    }
  } catch (error) {
    console.error('PDF generation failed:', error);
    window.print();
  }
};

const openExternalLink = async () => {
  try {
    await Browser.open({ url: 'https://solo-diary-khaki.vercel.app/' });
  } catch (error) {
    window.open('https://solo-diary-khaki.vercel.app/', '_system');
    console.error("Browser plugin error:", error);
  }
};
  
const openAndroidLink = async () => {
  try {
    await Browser.open({ url: 'https://github.com/rajprajapati2001/SoloDiary/raw/refs/heads/main/android/app/build/outputs/apk/release/app-release.apk' });
  } catch (error) {
    window.open('https://github.com/rajprajapati2001/SoloDiary/raw/refs/heads/main/android/app/build/outputs/apk/release/app-release.apk', '_system');
    console.error("Browser plugin error:", error);
  }
};

const handleImageReport = async () => {
  const element = document.getElementById('printable-report');
  if (!element) {
    alert("Report element not found");
    return;
  }

  console.log("Generating report...");

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      scale: 3, // Increased to 3 for extra sharp text on mobile
      backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
    });

    const fileName = `SoloDiary-${userName || 'User'}-${selectedMonth}${selectedYear}.png`;

    // Android APK: Save to filesystem and share
    if (Capacitor.isNativePlatform()) {
      try {
        const pngDataUrl = canvas.toDataURL('image/png', 1.0);

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: pngDataUrl,
          directory: Directory.Documents,
        });

        await Share.share({
          title: 'SoloDiary Report',
          text: `SoloDiary Report - ${monthLabelText} ${selectedYear}`,
          url: savedFile.uri,
          dialogTitle: 'Share or Save Report',
        });
      } catch (nativeErr: any) {
        if (nativeErr?.message !== 'Share canceled') {
          console.error('Android PNG share failed:', nativeErr);
          // Fallback: open the file directly
          try {
            const pngDataUrl = canvas.toDataURL('image/png', 1.0);
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: pngDataUrl,
              directory: Directory.Documents,
            });
            await FileOpener.openFile({
              path: savedFile.uri,
              mimeType: 'image/png'
            });
          } catch (fallbackErr) {
            console.error('Android PNG fallback failed:', fallbackErr);
            alert('Could not save image report.');
          }
        }
      }
      return;
    }

    // Web/PC: Use blob sharing or fallback download
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error("Canvas to Blob conversion failed");
        return;
      }

      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'SoloDiary Report',
            text: `Check out my report for ${selectedMonth} ${selectedYear}`,
          });
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            downloadFallback(canvas, fileName);
          }
        }
      } else {
        downloadFallback(canvas, fileName);
      }
    }, 'image/png', 1.0);

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
      <link rel="icon" type="image/x-icon" href="https://raw.githubusercontent.com/rajprajapati2001/SoloDiary/main/assets/icons/solodiary_icon_512x512.png">
      <title>SoloDiary Report</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        ${styles}
        body { background-color: #f3f4f6; }
        /* Force CalendarView dark bg in print & export */
        .bg-slate-800\/80,
        .bg-slate-800\/80 > div.bg-white {
          background-color: rgba(30,41,59,0.8) !important;
          color: white !important;
        }
        .bg-slate-800\/80 h3,
        .bg-slate-800\/80 button,
        .bg-slate-800\/80 span {
          color: white !important;
        }
        .bg-slate-800\/80 .text-gray-400 { color: #94a3b8 !important; }
        .bg-slate-800\/80 .text-gray-700,
        .bg-slate-800\/80 .dark\:text-gray-300 { color: #cbd5e1 !important; }
        .bg-slate-800\/80 .bg-blue-100 { background-color: rgba(30,58,138,0.4) !important; color: #93c5fd !important; }
        .bg-slate-800\/80 .text-blue-600 { color: #93c5fd !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .matrix-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 10px; margin-bottom: 30px; }
        .matrix-card { padding: 10px; border: 1px solid #e2e8f0; border-radius: 10px; background: white; cursor: pointer; transition: all 0.2s ease; }
        /* Active state for regular cards (no goal) – blue */
        .matrix-card.active:not([data-has-goal="true"]) {
          border: 2px solid #2563eb !important;
          background: #eff6ff !important;
          transform: translateY(-2px);
        }

        /* Active state for goal cards – emerald green */
        .matrix-card.active[data-has-goal="true"] {
          border: 2px solid #10b981 !important;
          background: #d1fae5 !important;
          transform: translateY(-2px);
        }
        .log-row { border-bottom: 1px solid #f1f5f9; transition: all 0.3s ease; border-left: 4px solid transparent; }
        .log-row.highlighted { background: #fffbeb !important; border-left-color: #f59e0b !important; }
        .goal-row { cursor: pointer; transition: all 0.2s ease; }
        .goal-row:hover { background: #f8fafc; }
        .goal-row.active { background: #fffbeb !important; }
        .code-badge { font-size: 7px; font-weight: 900; color: #2563eb; background: #eff6ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #dbeafe; text-transform: uppercase; }
        [data-finance-toggle] { cursor: pointer; transition: all 0.3s ease; }
        [data-finance-toggle]:hover { transform: scale(1.02); }
        [data-finance-toggle].finance-active { outline: 3px solid #f59e0b !important; outline-offset: -3px; background: #fffbeb !important; }
        .goal-labels-hidden .goal-label { display: none !important; }
        [data-toggle-labels] { cursor: pointer; }
      </style>
    </head>
    <body>
      ${element.outerHTML}
      <script>
        // Goal Labels Toggle (Eye button)
        document.addEventListener('click', function(e) {
          var toggleBtn = e.target.closest('[data-toggle-labels]');
          if (toggleBtn) {
            var container = toggleBtn.closest('.print-section');
            if (!container) return;
            var graphContainer = container.querySelector('.linegraph-container');
            if (!graphContainer) return;
            graphContainer.classList.toggle('goal-labels-hidden');
            // Swap eye icon SVGs
            var svgs = toggleBtn.querySelectorAll('svg');
            var isHidden = graphContainer.classList.contains('goal-labels-hidden');
            toggleBtn.title = isHidden ? 'Show Labels' : 'Hide Labels';
            // Replace icon: show eye-off when hidden, eye when visible
            toggleBtn.innerHTML = isHidden
              ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>'
              : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
          }
        });

        // Date Highlighter
        document.addEventListener('click', (e) => {
          const btn = e.target.closest('button[data-date]');
          if (btn) {
            const dateStr = btn.getAttribute('data-date');
            const target = document.getElementById('ledger-date-' + dateStr);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              target.style.backgroundColor = '#eff6ff';
              setTimeout(() => {
                target.style.backgroundColor = '';
              }, 2000);
            }
          }

          // Graph point click - scroll to ledger date
          const graphPoint = e.target.closest('g[data-fulldate]');
          if (graphPoint) {
            const fullDate = graphPoint.getAttribute('data-fulldate');
            if (fullDate) {
              const target = document.getElementById('ledger-date-' + fullDate);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                target.style.backgroundColor = '#eff6ff';
                setTimeout(() => {
                  target.style.backgroundColor = '';
                }, 2000);
              }
            }
          }
        });

        // Matrix Card click delegation
        document.addEventListener('click', (e) => {
          const card = e.target.closest('.matrix-card');
          if (card) {
            const code = card.getAttribute('data-code');
            if (code) window.toggleHighlight(code);
            return;
          }
          // Goal row click delegation
          const goalRow = e.target.closest('.goal-row');
          if (goalRow) {
            const code = goalRow.getAttribute('data-code');
            if (code) window.toggleHighlight(code);
          }
        });

        // Code Highlighter (like in handleWebView)
        window.toggleHighlight = function(code) {
          const cards = document.querySelectorAll('.matrix-card');
          const rows = document.querySelectorAll('.log-row');
          const goalRows = document.querySelectorAll('.goal-row');
          const selectedCard = document.querySelector('.matrix-card[data-code="' + code + '"]');
          const selectedGoal = document.querySelector('.goal-row[data-code="' + code + '"]');

          const isAlreadyActive = (selectedCard && selectedCard.classList.contains('active')) || 
                                  (selectedGoal && selectedGoal.classList.contains('active'));

          // Reset everything
          cards.forEach(c => c.classList.remove('active'));
          rows.forEach(r => r.classList.remove('highlighted'));
          goalRows.forEach(r => r.classList.remove('active'));
          document.querySelectorAll('[data-finance-toggle]').forEach(el => el.classList.remove('finance-active'));

          // Apply highlight if it wasn't already active
          if (!isAlreadyActive) {
            document.querySelectorAll('.matrix-card[data-code="' + code + '"]').forEach(c => c.classList.add('active'));
            document.querySelectorAll('.log-row[data-code="' + code + '"]').forEach(r => r.classList.add('highlighted'));
            document.querySelectorAll('.goal-row[data-code="' + code + '"]').forEach(r => r.classList.add('active'));

            // Scroll to the first instance in the table
            const firstMatch = document.querySelector('.log-row[data-code="' + code + '"]');
            if (firstMatch) {
              firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        };

        // Finance toggle click delegation
        document.addEventListener('click', function(e) {
          var finCard = e.target.closest('[data-finance-toggle]');
          if (finCard) {
            var mode = finCard.getAttribute('data-finance-toggle');
            if (mode) window.toggleFinanceHighlight(mode);
          }
        });

        // --- Search Description Filter ---
        (function() {
          var searchInput = document.getElementById('search-description-input');
          if (searchInput) {
            searchInput.addEventListener('input', function() {
              var query = this.value.toLowerCase();
              var rows = document.querySelectorAll('tr.log-row');
              rows.forEach(function(row) {
                var text = row.textContent.toLowerCase();
                row.style.display = (query === '' || text.indexOf(query) !== -1) ? '' : 'none';
              });
              // Show/hide date headers
              var headers = document.querySelectorAll('tr[id^="ledger-date-"]');
              headers.forEach(function(header) {
                var next = header.nextElementSibling;
                var visible = false;
                while (next && next.classList.contains('log-row')) {
                  if (next.style.display !== 'none') { visible = true; break; }
                  next = next.nextElementSibling;
                }
                header.style.display = visible ? '' : 'none';
              });
            });
          }
        })();

        window.toggleFinanceHighlight = function(mode) {
          var allFinCards = document.querySelectorAll('[data-finance-toggle]');
          var rows = document.querySelectorAll('.log-row');
          var cards = document.querySelectorAll('.matrix-card');
          var goalRows = document.querySelectorAll('.goal-row');
          var clickedCard = document.querySelector('[data-finance-toggle="' + mode + '"]');
          var isActive = clickedCard && clickedCard.classList.contains('finance-active');

          allFinCards.forEach(function(el) { el.classList.remove('finance-active'); });
          rows.forEach(function(r) { r.classList.remove('highlighted'); });
          cards.forEach(function(c) { c.classList.remove('active'); });
          goalRows.forEach(function(r) { r.classList.remove('active'); });

          if (!isActive) {
            if (clickedCard) clickedCard.classList.add('finance-active');
            var highlightedCodes = new Set();

            if (mode === 'goals') {
              goalRows.forEach(function(r) {
                r.classList.add('active');
                var code = r.getAttribute('data-code');
                if (code) highlightedCodes.add(code);
              });
              rows.forEach(function(r) {
                if (highlightedCodes.has(r.getAttribute('data-code'))) r.classList.add('highlighted');
              });
            } else {
              rows.forEach(function(r) {
                var debit = parseFloat(r.getAttribute('data-debit') || '0');
                var credit = parseFloat(r.getAttribute('data-credit') || '0');
                var match = false;
                if (mode === 'net') match = debit > 0 || credit > 0;
                else if (mode === 'debit') match = debit > 0;
                else if (mode === 'credit') match = credit > 0;
                if (match) {
                  r.classList.add('highlighted');
                  highlightedCodes.add(r.getAttribute('data-code'));
                }
              });
              goalRows.forEach(function(r) {
                if (highlightedCodes.has(r.getAttribute('data-code'))) r.classList.add('active');
              });
            }

            cards.forEach(function(c) {
              if (highlightedCodes.has(c.getAttribute('data-code'))) c.classList.add('active');
            });

            var obj = document.getElementById('strategic-objectives');
            if (obj) obj.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        };
      </script>
    </body>
    </html>
  `;

  const fileName = `SoloDiary-${userName || 'User'}-${selectedMonth}${selectedYear}.html`;

  try {
    // Android APK: Save HTML to filesystem and share
    if (Capacitor.isNativePlatform()) {
      try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const base64Data = await blobToBase64(blob);

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data as string,
          directory: Directory.Documents,
        });

        // Let user share/save via system share sheet
        await Share.share({
          title: 'SoloDiary HTML Report',
          text: `SoloDiary Report - ${monthLabelText} ${selectedYear}`,
          url: savedFile.uri,
          dialogTitle: 'Share or Save Report',
        });
      } catch (nativeErr: any) {
        if (nativeErr?.message !== 'Share canceled') {
          console.error('Android HTML export failed:', nativeErr);
          // Fallback: open the saved file directly
          try {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const base64Data = await blobToBase64(blob);
            const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: base64Data as string,
              directory: Directory.Documents,
            });
            await FileOpener.openFile({
              path: savedFile.uri,
              mimeType: 'text/html'
            });
          } catch (fallbackErr) {
            console.error('Android HTML fallback failed:', fallbackErr);
            alert('Could not save HTML report.');
          }
        }
      }
      return;
    }

    // Web/PC: Standard Blob Download
    htmlDownloadFallback(htmlContent, fileName);
  } catch (err) {
    console.error('HTML Export failed:', err);
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
 const [isClosingDesktop, setIsClosingDesktop] = useState(false);
 const reportWrapperRef = useRef<HTMLDivElement>(null);
 const printableReportRef = useRef<HTMLDivElement>(null);

 const closeDesktop = useCallback(() => {
   setIsClosingDesktop(true);
   setTimeout(() => {
     setIsDesktop(false);
     setIsClosingDesktop(false);
   }, 300);
 }, []);

 // Lock body scroll when fullscreen report is open
 useEffect(() => {
   onFullscreenChange?.(isDesktop);

   if (isDesktop) {
     document.body.style.overflow = 'hidden';
     document.body.dataset.disableSwipeNav = 'true';
   } else {
     document.body.style.overflow = '';
     delete document.body.dataset.disableSwipeNav;
   }
   return () => {
     onFullscreenChange?.(false);
     document.body.style.overflow = '';
     delete document.body.dataset.disableSwipeNav;
   };
 }, [isDesktop, onFullscreenChange]);

 // Pinch-to-zoom for Android APK desktop view
 useEffect(() => {
   if (!isDesktop) return;
   const container = reportWrapperRef.current;
   if (!container) return;
   const report = printableReportRef.current;
   if (!report) return;

   let currentScale = window.innerWidth / 1024;
   report.style.transform = `scale(${currentScale})`;
   let startDist = 0;
   let startScale = currentScale;

   const getDistance = (t1: Touch, t2: Touch) =>
     Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

   const onTouchStart = (e: TouchEvent) => {
     if (e.touches.length === 2) {
       startDist = getDistance(e.touches[0], e.touches[1]);
       startScale = currentScale;
     }
   };

   const onTouchMove = (e: TouchEvent) => {
     if (e.touches.length === 2) {
       e.preventDefault();
       const dist = getDistance(e.touches[0], e.touches[1]);
       const ratio = dist / startDist;
       currentScale = Math.min(Math.max(startScale * ratio, 0.15), 1.5);
       report.style.transform = `scale(${currentScale})`;
     }
   };

   container.addEventListener('touchstart', onTouchStart, { passive: true });
   container.addEventListener('touchmove', onTouchMove, { passive: false });

   return () => {
     container.removeEventListener('touchstart', onTouchStart);
     container.removeEventListener('touchmove', onTouchMove);
   };
 }, [isDesktop]);
 {/* Logic: Calculate the net balance */}
const netAmount = totalCreditAmt - totalDebitAmt;
const isNegative = netAmount < 0;

const [showLabels, setShowLabels] = useState(true);


  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20">
{!isDesktop && (
<>
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
    <div className="flex flex-row flex-nowrap items-center justify-center gap-2 md:gap-4 w-full md:w-auto">
      
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
          onClick={handleWebReport} 
          className="group flex items-center justify-center gap-2 bg-green-600 text-white p-2.5 md:px-4 md:py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-green-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
        >
          <FileCode2 size={16} className="group-hover:rotate-12 transition-transform"/> 
          <span className="hidden md:inline">HTML</span>
        </button>

        <button 
          onClick={handleImageReport} 
          className="group flex items-center justify-center gap-2 bg-pink-600 text-white p-2.5 md:px-4 md:py-2 rounded-xl font-bold shadow-lg shadow-pink-500/10 hover:bg-prink-700 hover:-translate-y-0.5 transition-all active:scale-95 text-[10px] uppercase tracking-tighter"
        >
          <ImageDown size={16} className="group-hover:rotate-12 transition-transform"/> 
          <span className="hidden md:inline">PNG</span>
        </button>
      </div>
    </div>
  </div>
</div>


      {/*Android Web View Report*/}
      
      <div className="lg:hidden max-w-[850px] mx-auto no-print">
      <button 
        onClick={() => setIsDesktop(true)}
        className="group relative w-full h-40 overflow-hidden rounded-xl active:scale-[0.98] transition-all duration-200 border border-slate-200 dark:border-slate-700"
      >
        {/* Pattern background */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800">
          <svg className="absolute inset-0 w-full h-full opacity-[0.08] dark:opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" className="text-slate-900 dark:text-slate-300" />
          </svg>
        </div>
        
        {/* Shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
        
        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 group-active:scale-90 transition-transform">
            <FileChartColumn size={26} className="text-white" />
          </div>
          <p className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">View PDF Report</p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Tap to Explore more</p>
        </div>
      </button>
      </div>

    </>
    )}

<div
  ref={reportWrapperRef}
  className={isDesktop
    ? `desktop-view-active${isClosingDesktop ? ' desktop-view-closing' : ''}`
    : 'max-w-[850px] mx-auto'}
>
      {/* PRINTABLE TRANSCRIPT AREA */}
      <div 
  ref={printableReportRef}
  id="printable-report" 
  className="antialiased font-medium bg-white p-10 text-slate-900 min-h-[297mm] w-[210mm] flex flex-col mx-auto shadow-lg border border-slate-100 overflow-hidden"
>
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-[3px] border-slate-950 pb-4 mb-6">
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-slate-950 flex items-center justify-center rounded-full shadow-lg border-2 border-slate-200 overflow-hidden">
  <img
    src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`}
    alt="Logo"
    crossOrigin="anonymous" 
    className="w-full h-full object-cover"
  />
</div>

            <div className="text-left space-y-0.5">
              <p className="text-[8px]  font-semibold uppercase tracking-[0.1em] text-slate-900">
                PRINCIPAL: {userName.toUpperCase()}
              </p>
              <p className="text-[8px]  font-semibold uppercase tracking-[0.1em] text-blue-600">
                PERIOD: {monthLabelText} {selectedYear}
              </p>
              <p className="text-[8px]  font-semibold uppercase tracking-[0.1em] text-slate-400">
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
              <h1 className="text-2xl  font-semibold tracking-tighter leading-none mb-0.5">SOLODIARY</h1>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
              <span className="text-blue-500">Think.</span>{' '}
              <span className="text-green-500">Write.</span>{' '}
              <span className="text-pink-500">Grow.</span>
              </p>
              <p className="text-[7px]  font-semibold text-slate-400 uppercase tracking-[0.2em]">Where your stories stay yours</p>
            </div>
            {/* Round Logo */}
<div className="w-[55px] h-[55px] bg-slate-950 flex items-center justify-center rounded-full shadow-lg border-2 border-slate-200 overflow-hidden">
  <img 
    src="https://raw.githubusercontent.com/rajprajapati2001/SoloDiary/main/assets/icons/solodiary_icon_512x512.png" 
    alt="Logo" 
    crossOrigin="anonymous"
    className="w-full h-full object-cover bg-cover bg-center" 
  />
</div>
          </div>
        </div>

        {/* Overview Module */}
        <div className="mb-8 print-section">
           <div className="flex justify-between items-end mb-4">
              <div className="space-y-0.5">
                <p className="text-base  font-semibold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  {monthLabelText} ({selectedYear}) Overview
                  <TrendingUp size={16} className="text-blue-600" />
                </p>
                <h3 className="text-4xl  font-semibold text-slate-900 leading-none tracking-tighter">
                  {userMonthPoints.toLocaleString()} / <span className="font-black text-slate-300">{monthTargetBase.toLocaleString()}</span>
                </h3>
                <p className="text-[9px]  font-semibold text-slate-400 uppercase tracking-[0.1em]">Points Earned <span className="text-black font-black">vs</span> Monthly Baseline</p>
              </div>

              <div className="flex gap-2">
                 <div className="bg-slate-950 text-white px-5 py-3 rounded-xl flex flex-col items-center justify-center min-w-[100px] shadow-sm">
                    <span className="text-2xl  font-semibold leading-none">{monthProgressPct.toFixed(1)}%</span>
                    <span className="text-[7px] uppercase  font-semibold opacity-60 mt-1 tracking-widest">Efficiency</span>
                 </div>
                 <div className="border-[2px] border-slate-950 text-slate-950 px-5 py-3 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
                    <span className="text-2xl  font-semibold leading-none">{userMonthPoints}</span>
                    <span className="text-[7px] uppercase  font-semibold opacity-40 mt-1 tracking-widest">Points</span>
                 </div>
              </div>
           </div>

           <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div className="h-full bg-gradient-to-r from-slate-950 to-blue-700 rounded-full transition-all duration-1000" style={{ width: `${Math.min(monthProgressPct, 100)}%` }} />
           </div>
        </div>

        {/* Data Matrix Module */}
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 mb-8 items-start print-section">
          <div className="bg-slate-800/80 rounded-2xl border border-slate-100 overflow-hidden" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
             <CalendarView 
                key={`${selectedYear}-${selectedMonth}`}
                entries={entries} 
                goals={goals} 
                selectedDate={`${selectedYear}-${selectedMonth}-01`} 
                onSelectDate={handleDateClick}
                onMonthChange={(m, y) => {
                  setSelectedMonth(m);
                  setSelectedYear(y);
                  setSelectedDate(`${y}-${m}-01`);
              }}
             />
          </div>
          <div className="space-y-3 flex flex-col h-full">
            <div className="p-5 border-[2px] border-slate-950 rounded-xl bg-white flex flex-col justify-center relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-2 opacity-10 text-slate-900">
                <Zap size={40} />
              </div>
              <p className="text-[9px]  font-semibold uppercase text-slate-400 mb-0.5 tracking-widest">Month Net Yield</p>
              <p className="text-3xl  font-bold text-slate-950 tracking-tighter">{userMonthPoints.toLocaleString()} PTS</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg flex flex-col justify-between">
                <p className="text-[8px]  font-semibold uppercase text-slate-400 mb-0.5 tracking-widest">
                  <Award size={10} className="text-blue-500 inline mr-1" /> Yearly Points
                </p>
                <p className="text-lg  font-semibold text-slate-950">{yearPoints.toLocaleString()}</p>
              </div>
              <div 
                data-finance-toggle="goals"
                onClick={() => handleFinanceToggle('goals')}
                className={`p-4 rounded-lg flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                  financeHighlight === 'goals' ? 'bg-purple-100 border-2 border-purple-400 ring-2 ring-purple-200' : 'bg-slate-50 border border-slate-100'
                }`}>
                <p className="text-[8px]  font-semibold uppercase text-slate-400 mb-0.5 tracking-widest">
                  <Target size={10} className="text-purple-500 inline mr-1" /> Yearly Goals
                </p>
                <p className="text-lg  font-semibold text-slate-950">{yearGoalsAchievedCount}</p>
              </div>
            </div>

            <div className="space-y-3">
    {/* Dynamic Top Card */}
    <div 
      data-finance-toggle="net"
      onClick={() => handleFinanceToggle('net')}
      className={`p-5 border-[2px] rounded-xl flex flex-col justify-center relative overflow-hidden group shadow-sm transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-95 ${
        financeHighlight === 'net' ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50' : (isNegative ? 'border-red-500 bg-white' : 'border-emerald-500 bg-white')
      }`}>
      <div className={`absolute top-0 right-0 p-2 opacity-10 ${isNegative ? 'text-red-900' : 'text-emerald-900'}`}>
        <Landmark size={40} />
      </div>
      
      <p className={`text-[9px]  font-semibold uppercase mb-0.5 tracking-widest ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
        Month Net Amount
      </p>
      
      <p className={`text-3xl  font-bold tracking-tighter ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
        {isNegative ? '- ' : '+ '} ₹{Math.abs(netAmount).toLocaleString()}
      </p>
    </div>

    {/* Bottom Grid */}
    <div className="grid grid-cols-2 gap-3">
      <div 
        data-finance-toggle="debit"
        onClick={() => handleFinanceToggle('debit')}
        className={`p-4 rounded-lg flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
          financeHighlight === 'debit' ? 'bg-red-100 border-2 border-red-400 ring-2 ring-red-200' : 'bg-red-50/50 border border-red-100'
        }`}>
         <p className="text-[8px]  font-semibold uppercase text-red-500 mb-0.5 tracking-widest">
           <Banknote size={10} className="inline mr-1" /> Debit
         </p>
         <p className="text-lg  font-semibold text-red-600">₹{totalDebitAmt.toLocaleString()}</p>
      </div>
      
      <div 
        data-finance-toggle="credit"
        onClick={() => handleFinanceToggle('credit')}
        className={`p-4 rounded-lg flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
          financeHighlight === 'credit' ? 'bg-emerald-100 border-2 border-emerald-400 ring-2 ring-emerald-200' : 'bg-emerald-50/50 border border-emerald-100'
        }`}>
         <p className="text-[8px]  font-semibold uppercase text-emerald-600 mb-0.5 tracking-widest">
           <Banknote size={10} className="inline mr-1" /> Credit
         </p>
         <p className="text-lg  font-semibold text-emerald-600">₹{totalCreditAmt.toLocaleString()}</p>
      </div>
    </div>
  </div>

          </div>
        </div>

        {/* Trajectory Module - Monthly Variance Projection*/}
        <h3 className="text-sm  font-semibold uppercase tracking-tighter text-slate-950 mb-3 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
             <ChartLine size={16} strokeWidth={3} className="text-purple-600" /> 
             Monthly Variance Projection
           </h3>

        
  <div className="mb-8 border border-slate-100 py-2 rounded-xl bg-slate-50/50 print-section relative">
    {/* Header Container */}
    <div className="flex items-center justify-between px-4 mb-4">
      
      {/* 1. Left Spacer (Empty div to balance the button) */}
      <div className="w-8" /> 

      {/* 2. Centered Title */}
      <h4 className="flex-1 text-[8px]  font-semibold text-center uppercase tracking-[0.3em] text-slate-400">
        Yield Trajectory ({monthLabelText} {selectedYear})
      </h4>

      {/* 3. Right Button */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          setShowLabels(!showLabels);
        }}
        data-toggle-labels
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
        onPointClick={(fullDate) => {
          const target = document.getElementById(`ledger-date-${fullDate}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.style.backgroundColor = '#eff6ff';
            setTimeout(() => { target.style.backgroundColor = ''; }, 2000);
          }
        }}
      />
    </div>
</div>

        {/* Goal Ledger Module "text-purple-600"*/}
        <div className="mb-8 print-section">
           <h3 id="strategic-objectives" className="text-sm  font-semibold uppercase tracking-tighter text-slate-950 mb-3 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
             <Target size={16} className="text-green-600" />
             Strategic Objectives
           </h3>
           <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white border-b border-slate-950">
                    <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest">ID</th>
                    <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest">Golas List</th>
                    <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest text-center">Value</th>
                    <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportGoals.sort((a,b) => (a.achievedAt ? 1 : -1)).map(g => (
                    <tr 
                      key={g.id} 
                      data-code={g.code}
                      onClick={() => {
                        setHighlightedCode(highlightedCode === g.code ? null : g.code);
                        setFinanceHighlight(null);
                        // Scroll to first matching log row
                        setTimeout(() => {
                          const row = document.querySelector(`tr.log-row[data-code="${g.code}"]`);
                          if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 50);
                      }}
                      className={`goal-row cursor-pointer transition-all duration-200 ${highlightedCode === g.code || isGoalFinanceHighlighted(g) ? 'ring-1 ring-inset ring-amber-200 bg-amber-50' : (g.achievedAt ? 'bg-emerald-50/20' : 'bg-white hover:bg-slate-50')}`}
                    >
                      <td className={`px-4 py-2  font-semibold text-[9px] text-blue-600 ${g.achievedAt ? 'line-through opacity-60' : ''}`}>{g.code}</td>
                      <td className={`px-4 py-2 font-medium text-[9px] text-slate-950 ${g.achievedAt ? 'line-through opacity-30' : ''}`}>{g.name}</td>
                      <td className={`px-4 py-2  font-semibold text-[9px] text-slate-950 text-center ${g.achievedAt ? 'line-through opacity-30' : ''}`}>+{g.points}</td>
                      <td className="px-4 py-2 text-right">
                         {g.achievedAt ? (
                           <div className="flex flex-col items-end leading-none">
                              <span className="text-emerald-700  font-semibold text-[7px] tracking-widest px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200 uppercase flex items-center gap-1">
                                <CheckCircle2 size={8} /> DONE
                              </span>
                              <span className="text-[6px]  font-semibold text-slate-400 mt-0.5 uppercase tracking-widest">{formatDateDDMMYYYY(g.achievedAt)}</span>
                           </div>
                         ) : (
                           <span className="text-red-500  font-semibold text-[7px] tracking-widest uppercase inline-flex items-center gap-0.5">
                            <Clock size={8} className="text-red-500" />
                            PENDING
                          </span>
                         )}
                      </td>
                    </tr>
                  ))}
                  {reportGoals.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-[9px] font-medium text-slate-300 italic">No objectives recorded.</td></tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>

        {/* Matrix */}
<div className="mb-8 print-section">
  <h3 className="text-sm  font-semibold uppercase tracking-tighter text-slate-950 mb-3 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
    <Zap size={16} className="text-blue-600" />
    Participation Matrix
  </h3>
  <div className="grid grid-cols-5 md:grid-cols-5 gap-2">
    {activitySummary.map(item => {
      // Check if this specific card is the one currently selected
      const isActive = highlightedCode === item.code || isCodeFinanceHighlighted(item.code);

      // Check if this card has a corresponding goal in your goals list
      const hasGoal = goals && goals.some(g => g.code === item.code);

      return (
<div 
  key={item.code} 
  data-code={item.code}
  data-has-goal={hasGoal ? 'true' : 'false'}
  // Toggle logic: if clicking the same one, turn it off (null), otherwise set to item.code
  onClick={() => { setHighlightedCode(highlightedCode === item.code ? null : item.code); setFinanceHighlight(null); }}
  className={`matrix-card relative p-2 border rounded-lg flex flex-col justify-between min-h-[60px] shadow-sm transition-all cursor-pointer ${
    isActive 
      ? hasGoal
        ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50' // If selected AND has a goal, it turns green!
        : 'border-blue-600 ring-2 ring-blue-100 bg-blue-50'       // Original active style for non-goal cards
      : hasGoal
        ? 'border-emerald-300 bg-white hover:border-emerald-500'   // Default resting style for goal cards
        : 'border-slate-100 bg-white hover:border-blue-200'       // Original resting style for regular cards
  }`}
>
  <div className="flex justify-between items-start mb-0.5">
    <span className={`text-[7px]  font-bold uppercase px-1 py-0.25 rounded border transition-colors ${
      isActive 
        ? hasGoal
          ? 'bg-emerald-500 text-white border-emerald-600' // Badge turns green if goal item is active
          : 'bg-blue-600 text-white border-blue-700'
        : 'text-blue-600 bg-blue-50 border-blue-100'
    }`}>
      {item.code}
    </span>
    <span className="text-[10px]  font-black text-slate-950">+{item.totalPoints}</span>
  </div>
  
  {/* Added padding-right to protect text from touching the bottom-right positioned star */}
  <div className="pr-4"> 
    <p className="text-[9px] font-medium text-slate-950 uppercase truncate mb-0.25">{item.name}</p>
    <p className="text-[6px]  font-semibold text-slate-400 uppercase tracking-widest">Logs: {item.count}</p>
  </div>

  {/* Green Star absolute positioned perfectly in the bottom-right corner */}
  {hasGoal && (
    <div style={{
      position: 'absolute',
      bottom: '4px',
      right: '4px',
      zIndex: 10,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#10b981'
    }}>
      <Star size={10} color="#10b981" fill="#10b981" />
    </div>
  )}
</div>
      );
    })}
    
    {activitySummary.length === 0 && (
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm col-span-full p-6 text-center text-[9px] font-medium text-slate-300 italic">
        No summary data.
      </div>
    )}
  </div>
</div>

        {/* Detailed Ledger */}
<div className="mb-8 print-section">
  <div className="flex items-center justify-between mb-3">
  <h3 className="text-sm  font-semibold uppercase tracking-tighter text-slate-950 border-l-[3px] border-slate-950 pl-2 flex items-center gap-2">
    <NotebookText size={16} className="text-pink-600" />
    Chronological Log Diary
  </h3>
  <input
  id="search-description-input"
  type="text"
  placeholder="Search descriptions..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  style={{
    padding: '3px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 500,
    width: '192px',
    outline: 'none',
  }}
  onFocus={(e) => { e.target.style.boxShadow = '0 0 0 2px #60a5fa'; }}
  onBlur={(e) => { e.target.style.boxShadow = ''; }}
/>
</div>
  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
    <table className="w-full text-left border-collapse">
      <thead className="table-header-group">
        <tr className="bg-slate-950 text-white">
          <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest w-24">Timestamp</th>
          <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest w-12 text-center">Code</th>
          <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest">Entry Details</th>
          {hasAttachmentsInReport && <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest w-12 text-center">QR</th> }
          {hasTransactionsInReport && <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest w-16 text-right">Account</th>}
           <th className="px-4 py-2 text-[7px]  font-semibold uppercase tracking-widest text-center w-14">Pts</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {Object.keys(filteredGroupedLogsByDate).length === 0 ? (
          <tr>
            <td colSpan={6} className="p-6 text-center text-[9px] font-medium text-slate-300 italic">
              No records found.
            </td>
          </tr>
        ) : (
Object.keys(filteredGroupedLogsByDate).sort().map((dateStr) => {
  const dayLogs = filteredGroupedLogsByDate[dateStr];
  const dayPts = dayLogs.reduce((s, e) => s + e.points, 0);
  
  // Calculate day's total debit and credit amounts
  const dayDebit = dayLogs.reduce((s, e) => s + (e.debit || 0), 0);
  const dayCredit = dayLogs.reduce((s, e) => s + (e.credit || 0), 0);
  
  const achievedGoalsToday = goals.filter(g => g.achievedAt === dateStr);
  return (
    <React.Fragment key={dateStr}>
      <tr id={`ledger-date-${dateStr}`} className="bg-slate-100/50 border-y border-slate-100 transition-colors duration-500">
        <td colSpan={6} className="px-4 py-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-semibold text-slate-950 tracking-[0.05em] uppercase flex items-center gap-2">
              <Clock size={10} className="text-blue-500" />
              {new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              <span className="text-gray-600/75">{` (${new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long' })})`}</span>
              {achievedGoalsToday.length > 0 && <Star size={10} className="text-amber-500 fill-amber-500" />}
            </span>
            
            <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest px-1.5 py-0.25 p-0.5 rounded bg-white border border-slate-100 flex items-center gap-2">
              <span>Debit: <span className="text-red-600 font-bold">-{dayDebit}₹</span></span>
              <span className="text-slate-300">|</span>
              <span>Credit: <span className="text-emerald-600 font-bold">+{dayCredit}₹</span></span>
              <span className="text-slate-300">|</span>
              <span>DAY YIELD: <span className="text-slate-950">{dayPts} PTS</span></span>
            </span>
          </div>
        </td>
      </tr>
                {groupedLogsByDate[dateStr].map(e => {
                  // HIGHLIGHT LOGIC: Check if this row's code matches the clicked matrix code
                  const isHighlighted = highlightedCode === e.code || isEntryFinanceHighlighted(e);
                  
                  return (
                    <tr 
                      key={e.id} 
                      data-code={e.code}
                      data-debit={e.debit || 0}
                      data-credit={e.credit || 0}
                      className={`log-row align-top transition-all duration-300 ${
                        isHighlighted 
                          ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' 
                          : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <td className="px-4 py-2 text-[8px]  font-semibold text-slate-900 whitespace-nowrap leading-tight">
                        {e.fromTime && e.isLongEvent ? (
                          <>
                            {e.fromTime} <span className="text-gray-600/75">To</span> {e.toTime}
                          </>
                        ) : (
                          e.toTime
                        )}
                      </td>
                      <td className="px-0 py-0 text-center">
                        <span className={`text-[7px]  font-semibold uppercase px-1.5 py-0.5 rounded border transition-colors ${
                          isHighlighted 
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                            : 'text-blue-600 bg-blue-50 border-blue-100'
                        }`}>
                          {e.code}
                        </span>
                      </td>
                      <td className="px-1.5 py-0.5">
                        <p className="text-[10px]  font-semibold leading-tight text-slate-950 mb-1 uppercase tracking-tighter flex items-center gap-1">
                          {goals.some(g => g.code === e.code && g.achievedAt === e.toDate) && <Star size={8} className="text-amber-500 fill-amber-500" />}
                          {e.name}
                        </p>
                        {e.description && (
                          <p className={`text-[8px] leading-normal whitespace-pre-wrap border-l pl-2 mt-1 transition-colors ${
                            isHighlighted ? 'text-slate-900 border-amber-400' : 'text-slate-600 border-slate-200'
                          }`}>
                            {e.description}
                          </p>
                        )}
                      </td>
                      
                      {hasAttachmentsInReport && (
                        <td className="px-0.5 py-0.5 text-center">
                          {e.attachment ? (
                            <div className="flex flex-col items-center justify-center">
                              <a 
                                href={e.attachment} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                title={e.attachment}
                                className="inline-block active:opacity-50 transition-opacity"
                              >
                                <QRCodeSVG value={e.attachment} size={40} level="M" />
                              </a>
                            </div>
                          ) : null}
                        </td>
                      )}
                      {hasTransactionsInReport && (
                        <td className="px-4 py-2 text-[8px]  font-semibold whitespace-nowrap text-right">
                          {e.debit! > 0 && <span className="text-red-600">-{e.debit}₹</span>}
                          {e.credit! > 0 && <span className="text-emerald-600 ml-1">+{e.credit}₹</span>}
                        </td>
                      )}
                      <td className="px-4 py-2 text-center text-[10px]  font-semibold text-slate-950">+{e.points}</td>
                    </tr>
                  );
                })}
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
            <p className="m-0 text-[7px] font-medium text-slate-500 uppercase tracking-widest">
              SoloDiary • EST 2026
            </p>
            <h4 className="m-0 text-[10px]  font-semibold uppercase tracking-tight text-slate-900 leading-none">
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
          <span className="text-[7px]  font-semibold text-slate-900 uppercase">Authorized Signatory:</span>
          <span className="text-[8px] font-medium text-slate-700 border-b border-slate-300 px-2 min-w-[80px]">
            {userName.toUpperCase()}
          </span>
        </div>
      </div>

      {/* RIGHT: Functional QR Code */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div className="p-1 bg-white border border-slate-200 rounded-sm shadow-sm">
          <a 
          href="https://solo-diary-khaki.vercel.app/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-block active:opacity-50 transition-opacity"
        >
          <QRCodeSVG 
            value="https://solo-diary-khaki.vercel.app/"
            size={54} 
            level="M" 
            includeMargin={false}
            imageSettings={{
              src: "https://raw.githubusercontent.com/rajprajapati2001/SoloDiary/refs/heads/main/assets/icons/solodiary_icon.ico",
              height: 15,
              width: 15,
              excavate: true,
            }}
          /></a>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[6px]  font-semibold text-slate-400 uppercase tracking-widest">Scan to Visit</span>
          <span className="text-[5px] font-medium text-slate-300 lowercase">solodiary.com</span>
        </div>
      </div>

    </div>
        <span className="text-[6px] font-medium text-slate-300 text-center">&copy; {currentYearNum} • <span className="text-green-300">SoloDiary</span> @ <span className="text-blue-300">Raj Prajapati</span></span>
      </div>
</div>

{isDesktop && (
  <button
    onClick={closeDesktop}
    className="close-desktop-btn"
  >
    <X size={20} />
  </button>
)}

      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          body { 
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
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

          /* Keep CalendarView dark bg when printing */
          #printable-report .bg-slate-800\\/80,
          #printable-report .bg-slate-800\\/80 > .bg-white {
            background-color: rgba(30,41,59,0.8) !important;
            color: white !important;
          }
          #printable-report .bg-slate-800\\/80 h3,
          #printable-report .bg-slate-800\\/80 button,
          #printable-report .bg-slate-800\\/80 span {
            color: white !important;
          }
          #printable-report .bg-slate-800\\/80 .text-gray-400 { color: #94a3b8 !important; }
          #printable-report .bg-slate-800\\/80 .text-gray-700 { color: #cbd5e1 !important; }
          #printable-report .bg-slate-800\\/80 .bg-blue-100 { background-color: rgba(30,58,138,0.4) !important; color: #93c5fd !important; }
          #printable-report .bg-slate-800\\/80 .text-blue-600 { color: #93c5fd !important; }
        }
          .matrix-card.active {
  border: 2px solid #2563eb !important;
  background: #eff6ff !important;
  transform: translateY(-2px);
}

.log-row.highlighted,
tr.highlighted {
  background: #fffbeb !important;
  border-left: 4px solid #f59e0b !important;
}
      `}</style>
    </div>
  );
};

export default StatsView;
