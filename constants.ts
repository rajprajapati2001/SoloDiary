import { ActivityTemplate } from './types';

export const CURRENCY_MAP: Record<string, { symbol: string; label: string; country: string }> = {
  // Original Currencies
  USD: { symbol: '$', label: 'USD ($)', country: 'United States' },
  EUR: { symbol: '€', label: 'EUR (€)', country: 'Eurozone' },
  GBP: { symbol: '£', label: 'GBP (£)', country: 'United Kingdom' },
  JPY: { symbol: '¥', label: 'JPY (¥)', country: 'Japan' },
  INR: { symbol: '₹', label: 'INR (₹)', country: 'India' },
  CAD: { symbol: 'CA$', label: 'CAD (CA$)', country: 'Canada' },
  AUD: { symbol: 'A$', label: 'AUD (A$)', country: 'Australia' },
  CNY: { symbol: '¥', label: 'CNY (¥)', country: 'China' },
  KRW: { symbol: '₩', label: 'KRW (₩)', country: 'South Korea' },
  BRL: { symbol: 'R$', label: 'BRL (R$)', country: 'Brazil' },
  RUB: { symbol: '₽', label: 'RUB (₽)', country: 'Russia' },
  ZAR: { symbol: 'R', label: 'ZAR (R)', country: 'South Africa' },

  // Middle East & Africa
  AED: { symbol: 'د.إ', label: 'AED (د.إ)', country: 'United Arab Emirates' },
  SAR: { symbol: 'ر.س', label: 'SAR (ر.س)', country: 'Saudi Arabia' },
  ILS: { symbol: '₪', label: 'ILS (₪)', country: 'Israel' },
  EGP: { symbol: 'E£', label: 'EGP (E£)', country: 'Egypt' },
  TRY: { symbol: '₺', label: 'TRY (₺)', country: 'Turkey' },
  QAR: { symbol: 'ر.ق', label: 'QAR (ر.ق)', country: 'Qatar' },
  KWD: { symbol: 'د.ك', label: 'KWD (د.ك)', country: 'Kuwait' },

  // Asia Pacific
  NZD: { symbol: 'NZ$', label: 'NZD (NZ$)', country: 'New Zealand' },
  SGD: { symbol: 'S$', label: 'SGD (S$)', country: 'Singapore' },
  HKD: { symbol: 'HK$', label: 'HKD (HK$)', country: 'Hong Kong' },
  IDR: { symbol: 'Rp', label: 'IDR (Rp)', country: 'Indonesia' },
  MYR: { symbol: 'RM', label: 'MYR (RM)', country: 'Malaysia' },
  PHP: { symbol: '₱', label: 'PHP (₱)', country: 'Philippines' },
  THB: { symbol: '฿', label: 'THB (฿)', country: 'Thailand' },
  VND: { symbol: '₫', label: 'VND (₫)', country: 'Vietnam' },
  PKR: { symbol: '₨', label: 'PKR (₨)', country: 'Pakistan' },
  BDT: { symbol: '৳', label: 'BDT (৳)', country: 'Bangladesh' },

  // Europe (Non-Eurozone)
  CHF: { symbol: 'CHF', label: 'CHF', country: 'Switzerland' },
  SEK: { symbol: 'kr', label: 'SEK (kr)', country: 'Sweden' },
  NOK: { symbol: 'kr', label: 'NOK (kr)', country: 'Norway' },
  DKK: { symbol: 'kr', label: 'DKK (kr)', country: 'Denmark' },
  PLN: { symbol: 'zł', label: 'PLN (zł)', country: 'Poland' },
  HUF: { symbol: 'Ft', label: 'HUF (Ft)', country: 'Hungary' },
  CZK: { symbol: 'Kč', label: 'CZK (Kč)', country: 'Czech Republic' },

  // Americas
  MXN: { symbol: 'Mex$', label: 'MXN (Mex$)', country: 'Mexico' },
  ARS: { symbol: 'Arg$', label: 'ARS (Arg$)', country: 'Argentina' },
  CLP: { symbol: 'CLP$', label: 'CLP (CLP$)', country: 'Chile' },
  COP: { symbol: 'Col$', label: 'COP (Col$)', country: 'Colombia' },
  PEN: { symbol: 'S/.', label: 'PEN (S/.)', country: 'Peru' },
};

export const getCurrencySymbol = (code: string | undefined): string => {
  if (!code) return '₹'; // Default fallback
  const upper = code.toUpperCase();
  return CURRENCY_MAP[upper]?.symbol ?? '¤'; // '¤' is the generic currency symbol
};

export const getAggregateCurrencyDisplay = (
  entries: { debit?: number; credit?: number; moneyCode?: string }[],
  fallbackDefault = 'INR'
): string => {
  const codes = new Set<string>();
  for (const entry of entries) {
    if ((entry.debit && entry.debit > 0) || (entry.credit && entry.credit > 0)) {
      const code = entry.moneyCode || fallbackDefault;
      codes.add(code.toUpperCase());
    }
  }
  if (codes.size === 0) {
    const saved = localStorage.getItem('solo_diary_default_currency') || fallbackDefault;
    return saved.toUpperCase();
  }
  if (codes.size === 1) {
    return Array.from(codes)[0];
  }
  return '¤';
};

export const INITIAL_ACTIVITIES: ActivityTemplate[] = [
  { id: '1', code: 'S', points: 10, name: 'Sleep' },
  { id: '2', code: 'BF', points: 2, name: 'Breakfast' },
  { id: '3', code: 'M', points: 2, name: 'Meal' },
  { id: '4', code: 'L', points: 5, name: 'Lunch' },
  { id: '5', code: 'D', points: 5, name: 'Dinner' },
  { id: '6', code: 'R', points: 10, name: 'Running' },
  { id: '7', code: 'W', points: 10, name: 'Walking' },
  { id: '8', code: 'E', points: 10, name: 'Exercise' },
  { id: '9', code: 'Y', points: 10, name: 'Yoga' },
  { id: '10', code: 'SP', points: 15, name: 'Shopping' },
  { id: '11', code: 'Cr', points: 10, name: 'Credit' },
  { id: '12', code: 'Db', points: 10, name: 'Debit' },
];