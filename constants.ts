import { ActivityTemplate } from './types';

export const CURRENCY_MAP: Record<string, { symbol: string; label: string; country: string }> = {
  // ─── Americas ──────────────────────────────────────────────
  USD: { symbol: '$', label: 'USD ($)', country: 'United States' },
  CAD: { symbol: 'CA$', label: 'CAD (CA$)', country: 'Canada' },
  MXN: { symbol: 'Mex$', label: 'MXN (Mex$)', country: 'Mexico' },
  BRL: { symbol: 'R$', label: 'BRL (R$)', country: 'Brazil' },
  ARS: { symbol: 'Arg$', label: 'ARS (Arg$)', country: 'Argentina' },
  CLP: { symbol: 'CLP$', label: 'CLP (CLP$)', country: 'Chile' },
  COP: { symbol: 'Col$', label: 'COP (Col$)', country: 'Colombia' },
  PEN: { symbol: 'S/.', label: 'PEN (S/.)', country: 'Peru' },
  UYU: { symbol: '$U', label: 'UYU ($U)', country: 'Uruguay' },
  PYG: { symbol: '₲', label: 'PYG (₲)', country: 'Paraguay' },
  BOB: { symbol: 'Bs.', label: 'BOB (Bs.)', country: 'Bolivia' },
  VES: { symbol: 'Bs.S', label: 'VES (Bs.S)', country: 'Venezuela' },        // new
  GTQ: { symbol: 'Q', label: 'GTQ (Q)', country: 'Guatemala' },             // new
  HNL: { symbol: 'L', label: 'HNL (L)', country: 'Honduras' },              // new
  NIO: { symbol: 'C$', label: 'NIO (C$)', country: 'Nicaragua' },           // new
  CRC: { symbol: '₡', label: 'CRC (₡)', country: 'Costa Rica' },            // new
  DOP: { symbol: 'RD$', label: 'DOP (RD$)', country: 'Dominican Republic' },// new
  CUP: { symbol: 'CUP', label: 'CUP', country: 'Cuba' },                    // new (unique code)

  // ─── Europe (incl. non‑euro) ──────────────────────────────
  EUR: { symbol: '€', label: 'EUR (€)', country: 'Eurozone' },
  GBP: { symbol: '£', label: 'GBP (£)', country: 'United Kingdom' },
  CHF: { symbol: 'CHF', label: 'CHF', country: 'Switzerland' },
  SEK: { symbol: 'SEK', label: 'SEK', country: 'Sweden' },                 // unique code
  NOK: { symbol: 'NOK', label: 'NOK', country: 'Norway' },                 // unique code
  DKK: { symbol: 'DKK', label: 'DKK', country: 'Denmark' },                // unique code
  PLN: { symbol: 'zł', label: 'PLN (zł)', country: 'Poland' },
  HUF: { symbol: 'Ft', label: 'HUF (Ft)', country: 'Hungary' },
  CZK: { symbol: 'Kč', label: 'CZK (Kč)', country: 'Czech Republic' },
  RUB: { symbol: '₽', label: 'RUB (₽)', country: 'Russia' },
  TRY: { symbol: '₺', label: 'TRY (₺)', country: 'Turkey' },
  RON: { symbol: 'RON', label: 'RON', country: 'Romania' },                // new
  BGN: { symbol: 'BGN', label: 'BGN', country: 'Bulgaria' },               // new
  ISK: { symbol: 'ISK', label: 'ISK', country: 'Iceland' },                // new
  ALL: { symbol: 'ALL', label: 'ALL', country: 'Albania' },                // new
  MKD: { symbol: 'MKD', label: 'MKD', country: 'North Macedonia' },        // new
  RSD: { symbol: 'RSD', label: 'RSD', country: 'Serbia' },                 // new
  BAM: { symbol: 'KM', label: 'BAM (KM)', country: 'Bosnia & Herzegovina' },// new

  // ─── Asia (incl. Middle East & Central) ────────────────────
  JPY: { symbol: '¥', label: 'JPY (¥)', country: 'Japan' },
  CNY: { symbol: '元', label: 'CNY (元)', country: 'China' },
  KRW: { symbol: '₩', label: 'KRW (₩)', country: 'South Korea' },
  INR: { symbol: '₹', label: 'INR (₹)', country: 'India' },
  IDR: { symbol: 'Rp', label: 'IDR (Rp)', country: 'Indonesia' },
  MYR: { symbol: 'RM', label: 'MYR (RM)', country: 'Malaysia' },
  PHP: { symbol: '₱', label: 'PHP (₱)', country: 'Philippines' },
  SGD: { symbol: 'S$', label: 'SGD (S$)', country: 'Singapore' },
  THB: { symbol: '฿', label: 'THB (฿)', country: 'Thailand' },
  VND: { symbol: '₫', label: 'VND (₫)', country: 'Vietnam' },
  HKD: { symbol: 'HK$', label: 'HKD (HK$)', country: 'Hong Kong' },
  NZD: { symbol: 'NZ$', label: 'NZD (NZ$)', country: 'New Zealand' },
  AUD: { symbol: 'A$', label: 'AUD (A$)', country: 'Australia' },
  PKR: { symbol: '₨', label: 'PKR (₨)', country: 'Pakistan' },
  BDT: { symbol: '৳', label: 'BDT (৳)', country: 'Bangladesh' },
  LKR: { symbol: 'Rs', label: 'LKR (Rs)', country: 'Sri Lanka' },
  NPR: { symbol: 'Rs.', label: 'NPR (Rs.)', country: 'Nepal' },
  MMK: { symbol: 'K', label: 'MMK (K)', country: 'Myanmar' },
  KZT: { symbol: '₸', label: 'KZT (₸)', country: 'Kazakhstan' },           // new
  UZS: { symbol: 'UZS', label: 'UZS', country: 'Uzbekistan' },             // new
  TMT: { symbol: 'TMT', label: 'TMT', country: 'Turkmenistan' },           // new
  IQD: { symbol: 'IQD', label: 'IQD', country: 'Iraq' },                   // new
  AFN: { symbol: 'Af', label: 'AFN (Af)', country: 'Afghanistan' },        // new
  LBP: { symbol: 'L£', label: 'LBP (L£)', country: 'Lebanon' },            // new
  SYP: { symbol: 'SYP', label: 'SYP', country: 'Syria' },                  // new
  YER: { symbol: 'YER', label: 'YER', country: 'Yemen' },                  // new
  GEL: { symbol: '₾', label: 'GEL (₾)', country: 'Georgia' },              // new
  AMD: { symbol: '֏', label: 'AMD (֏)', country: 'Armenia' },               // new
  AZN: { symbol: '₼', label: 'AZN (₼)', country: 'Azerbaijan' },           // new

  // ─── Middle East (additional) ──────────────────────────────
  AED: { symbol: 'د.إ', label: 'AED (د.إ)', country: 'UAE' },
  SAR: { symbol: 'ر.س', label: 'SAR (ر.س)', country: 'Saudi Arabia' },
  ILS: { symbol: '₪', label: 'ILS (₪)', country: 'Israel' },
  EGP: { symbol: 'E£', label: 'EGP (E£)', country: 'Egypt' },
  QAR: { symbol: 'ر.ق', label: 'QAR (ر.ق)', country: 'Qatar' },
  KWD: { symbol: 'د.ك', label: 'KWD (د.ك)', country: 'Kuwait' },
  BHD: { symbol: 'د.ب', label: 'BHD (د.ب)', country: 'Bahrain' },
  OMR: { symbol: 'ر.ع.', label: 'OMR (ر.ع.)', country: 'Oman' },
  JOD: { symbol: 'د.ا', label: 'JOD (د.ا)', country: 'Jordan' },

  // ─── Africa ─────────────────────────────────────────────────
  ZAR: { symbol: 'R', label: 'ZAR (R)', country: 'South Africa' },
  NGN: { symbol: '₦', label: 'NGN (₦)', country: 'Nigeria' },
  GHS: { symbol: 'GH₵', label: 'GHS (GH₵)', country: 'Ghana' },
  KES: { symbol: 'KSh', label: 'KES (KSh)', country: 'Kenya' },
  TZS: { symbol: 'TSh', label: 'TZS (TSh)', country: 'Tanzania' },
  UGX: { symbol: 'USh', label: 'UGX (USh)', country: 'Uganda' },
  ZMW: { symbol: 'ZK', label: 'ZMW (ZK)', country: 'Zambia' },
  MZN: { symbol: 'MTn', label: 'MZN (MTn)', country: 'Mozambique' },
  MAD: { symbol: 'د.م.', label: 'MAD (د.م.)', country: 'Morocco' },
  DZD: { symbol: 'د.ج', label: 'DZD (د.ج)', country: 'Algeria' },
  AOA: { symbol: 'Kz', label: 'AOA (Kz)', country: 'Angola' },             // new
  ETB: { symbol: 'Br', label: 'ETB (Br)', country: 'Ethiopia' },           // new
  SDG: { symbol: 'SDG', label: 'SDG', country: 'Sudan' },                  // new
  SSP: { symbol: 'SSP', label: 'SSP', country: 'South Sudan' },            // new
  LYD: { symbol: 'LYD', label: 'LYD', country: 'Libya' },                  // new
  TND: { symbol: 'TND', label: 'TND', country: 'Tunisia' },                // new
  BWP: { symbol: 'P', label: 'BWP (P)', country: 'Botswana' },             // new
  NAD: { symbol: 'NAD', label: 'NAD', country: 'Namibia' },                // new
  ZWL: { symbol: 'ZWL', label: 'ZWL', country: 'Zimbabwe' },               // new

  // ─── Oceania ─────────────────────────────────────────────────
  FJD: { symbol: 'FJ$', label: 'FJD (FJ$)', country: 'Fiji' },             // new
  PGK: { symbol: 'K', label: 'PGK (K)', country: 'Papua New Guinea' },     // new
  // note: NZD & AUD already listed above

  // ─── Special / Regional ────────────────────────────────────
  // CFA franc (many countries) – represented by the currency code as symbol
  XAF: { symbol: 'XAF', label: 'XAF', country: 'Central Africa (CFA)' },
  XOF: { symbol: 'XOF', label: 'XOF', country: 'West Africa (CFA)' },
  XCD: { symbol: 'EC$', label: 'XCD (EC$)', country: 'Eastern Caribbean' },
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