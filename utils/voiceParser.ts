import { ActivityTemplate, Goal } from '../types';
import { INITIAL_ACTIVITIES, CURRENCY_MAP } from '../constants';

export interface ParsedVoiceResult {
  code: string;
  name: string;
  points: number;
  fromDate?: string;
  fromTime?: string;
  toDate?: string;
  toTime?: string;
  isLongEvent: boolean;
  debit?: number;
  credit?: number;
  isCashTransaction: boolean;
  moneyCode: string;
  description?: string;
  isDescriptionOpen: boolean;
  rawTranscript: string;
  isGoal?: boolean;
  isNewActivity?: boolean;
  matchedTemplate?: ActivityTemplate | Goal;
}

// Activity alias dictionary mapping natural spoken words to INITIAL_ACTIVITIES codes
// NOTE: Debit and Credit are NOT included here to prevent financial terms from overriding activities
const ACTIVITY_SYNONYMS: Record<string, string[]> = {
  S: ['sleep', 'sleeping', 'slept', 'nap', 'bedtime', 'slumber', 'resting', 'rest'],
  BF: ['breakfast', 'break fast', 'bf', 'morning meal', 'morning food'],
  M: ['meal', 'food', 'eating', 'ate', 'snack', 'snacks', 'brunch'],
  L: ['lunch', 'afternoon meal', 'lunchtime'],
  D: ['dinner', 'supper', 'night meal', 'dinnertime'],
  R: ['running', 'run', 'ran', 'jogging', 'jog', 'sprint', 'jogged'],
  W: ['walking', 'walk', 'walked', 'stroll', 'steps', 'trekking', 'trek'],
  E: ['exercise', 'workout', 'working out', 'gym', 'training', 'fitness', 'cardio', 'weights'],
  Y: ['yoga', 'meditation', 'meditate', 'pranayam', 'stretching', 'mindfulness'],
  SP: ['shopping', 'shop', 'shopped', 'market', 'grocery', 'groceries', 'buying', 'bought', 'purchase', 'mall']
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  twentyfive: 25, 'twenty-five': 25, thirty: 30, forty: 40, fifty: 50,
  hundred: 100
};

/**
 * Format hours and minutes to HH:MM format (24-hour)
 */
function toHHMM(hours: number, minutes: number = 0): string {
  const h = Math.max(0, Math.min(23, hours));
  const m = Math.max(0, Math.min(59, minutes));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Helper to convert 12-hour spoken numbers to 24-hour format.
 * Supports both colon (5:15) and dot (5.15) separators, plus a.m. / p.m. modifiers.
 */
function parseSpokenTimeTo24Hour(timeStr: string, modifier?: string): string | null {
  const clean = timeStr.trim().toLowerCase();
  
  const timeMatch = clean.match(/^(\d{1,2})[:.](\d{2})$/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = parseInt(timeMatch[2], 10);
    if (modifier === 'pm' && h < 12) h += 12;
    if (modifier === 'am' && h === 12) h = 0;
    return toHHMM(h, m);
  }

  const num = parseInt(clean, 10);
  if (!isNaN(num) && num >= 0 && num <= 24) {
    let h = num;
    if (modifier === 'pm' && h < 12) h += 12;
    if (modifier === 'am' && h === 12) h = 0;
    return toHHMM(h, 0);
  }

  return null;
}

/**
 * Capitalize first letter of a string
 */
export function capitalizeFirst(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Generate a concise 2-character code for new custom activities
 * e.g. "gameplay" -> "GP", "video editing" -> "VE", "coding" -> "CD"
 */
function generateActivityCode(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const clean = parts[0].toUpperCase();
  if (clean.length <= 3) return clean;
  // Extract consonants
  const consonants = clean.slice(1).replace(/[AEIOU]/g, '');
  if (consonants.length > 0) {
    const midConsonant = consonants[Math.floor(consonants.length / 2)];
    return (clean[0] + midConsonant).slice(0, 2);
  }
  return clean.slice(0, 2);
}

/**
 * Lightweight, 100% offline natural language voice parser for SoloDiary entries
 * Extracts: Activity, Points, Time to Time, Debit/Credit, and clean remaining Notes
 */
export function parseVoiceInput(
  transcript: string,
  userTemplates: ActivityTemplate[] = [],
  userGoals: Goal[] = []
): ParsedVoiceResult {
  const rawTranscript = transcript.trim();
  const text = rawTranscript.toLowerCase();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentTimeStr = now.toTimeString().slice(0, 5);

  // Keep track of matched text pieces to exclude them from the description
  const consumedPieces: string[] = [];

  // Check user default currency from localStorage
  const savedCurrency = (typeof window !== 'undefined' && localStorage.getItem('solo_diary_default_currency')) || 'INR';
  let detectedMoneyCode = savedCurrency;

  if (text.includes('dollar') || text.includes('usd') || text.includes('$')) {
    detectedMoneyCode = 'USD';
    consumedPieces.push('dollar', 'dollars', 'usd', '$');
  } else if (text.includes('euro') || text.includes('eur') || text.includes('€')) {
    detectedMoneyCode = 'EUR';
    consumedPieces.push('euro', 'euros', 'eur', '€');
  } else if (text.includes('pound') || text.includes('gbp') || text.includes('£')) {
    detectedMoneyCode = 'GBP';
    consumedPieces.push('pound', 'pounds', 'gbp', '£');
  } else if (text.includes('rupee') || text.includes('inr') || text.includes('₹') || text.includes('rs')) {
    detectedMoneyCode = 'INR';
    consumedPieces.push('rupee', 'rupees', 'inr', '₹', 'rs');
  }

  // Combine user templates with default INITIAL_ACTIVITIES from constants.ts
  const templatePool: ActivityTemplate[] = [
    ...INITIAL_ACTIVITIES,
    ...userTemplates.filter(ut => !INITIAL_ACTIVITIES.some(it => it.code.toLowerCase() === ut.code.toLowerCase()))
  ];

  // Activities excluding financial transaction pseudo-activities (Db / Cr)
  // Saved and built-in activities should ALWAYS have priority over Debit/Credit
  const nonFinancialTemplates = templatePool.filter(t => t.code !== 'Db' && t.code !== 'Cr');

  let matchedTemplate: ActivityTemplate | Goal | undefined;
  let isGoal = false;
  let isNewActivity = false;

  // Find candidate matches across Goals, Non-financial templates, and Synonyms
  // Pick the one that occurs EARLIEST in the spoken text (sentence order priority)
  interface MatchCandidate {
    template: ActivityTemplate | Goal;
    isGoal: boolean;
    index: number;
    consumed: string[];
  }

  const candidates: MatchCandidate[] = [];

  // 1. Check user Goals
  if (userGoals.length > 0) {
    for (const g of userGoals) {
      const goalName = g.name.toLowerCase();
      const goalCode = g.code.toLowerCase();
      const regexName = new RegExp(`\\b${goalName}\\b`, 'i');
      const regexCode = new RegExp(`\\b(?:goal|code)?\\s*${goalCode}\\b`, 'i');
      
      const mName = text.match(regexName);
      if (mName && mName.index !== undefined) {
        candidates.push({
          template: g,
          isGoal: true,
          index: mName.index,
          consumed: [mName[0]]
        });
      } else if (text.includes('goal')) {
        const mCode = text.match(regexCode);
        if (mCode && mCode.index !== undefined) {
          candidates.push({
            template: g,
            isGoal: true,
            index: mCode.index,
            consumed: [mCode[0]]
          });
        }
      }
    }
  }

  // 2. Check exact code mentions: "code BF", "code SP", "code S"
  const codeMatch = text.match(/\b(?:code|id)\s+([a-z0-9]{1,4})\b/i);
  if (codeMatch && codeMatch.index !== undefined) {
    const spokenCode = codeMatch[1].toUpperCase();
    const goalMatch = userGoals.find(g => g.code.toUpperCase() === spokenCode);
    if (goalMatch) {
      candidates.push({
        template: goalMatch,
        isGoal: true,
        index: codeMatch.index,
        consumed: [codeMatch[0]]
      });
    } else {
      const tMatch = nonFinancialTemplates.find(t => t.code.toUpperCase() === spokenCode);
      if (tMatch) {
        candidates.push({
          template: tMatch,
          isGoal: false,
          index: codeMatch.index,
          consumed: [codeMatch[0]]
        });
      }
    }
  }

  // 3. Check for non-financial template direct names (e.g. "meal", "yoga", "dinner", "badminton", etc.)
  for (const template of nonFinancialTemplates) {
    const templateName = template.name.toLowerCase();
    const regex = new RegExp(`\\b${templateName}\\b`, 'i');
    const m = text.match(regex);
    if (m && m.index !== undefined) {
      candidates.push({
        template,
        isGoal: false,
        index: m.index,
        consumed: [m[0]]
      });
    }
  }

  // 4. Check for Activity synonyms from INITIAL_ACTIVITIES (e.g. "breakfast", "gym", "meditation", "stroll")
  for (const [codeKey, synonyms] of Object.entries(ACTIVITY_SYNONYMS)) {
    for (const syn of synonyms) {
      const regex = new RegExp(`\\b${syn}\\b`, 'i');
      const m = text.match(regex);
      if (m && m.index !== undefined) {
        const t = nonFinancialTemplates.find(it => it.code.toUpperCase() === codeKey.toUpperCase());
        if (t) {
          candidates.push({
            template: t,
            isGoal: false,
            index: m.index,
            consumed: [m[0]]
          });
        }
      }
    }
  }

  // Pick earliest matched candidate in text
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.index - b.index);
    const best = candidates[0];
    matchedTemplate = best.template;
    isGoal = best.isGoal;
    consumedPieces.push(...best.consumed);
  }

  // 5. If still not matched, extract first spoken word(s) as a NEW custom activity (e.g. "gameplay", "reading", "video games")
  if (!matchedTemplate) {
    const rawWords = rawTranscript.split(/\s+/);
    
    // Stop words that should NEVER be treated as activity names
    const stopWords = new Set([
      'at', 'around', 'from', 'to', 'till', 'until', 'for', 'in', 'on', 'with', 'by',
      'debit', 'debited', 'credit', 'credited', 'spent', 'spend', 'paid', 'pay', 'cost', 'expense',
      'salary', 'income', 'deposit', 'bonus', 'cash', 'money', 'rupee', 'rupees', 'dollar', 'dollars',
      'inr', 'usd', 'eur', 'gbp', 'points', 'point', 'pts', 'score', 'today', 'yesterday', 'tomorrow',
      'am', 'pm', 'notes', 'note', 'description', 'details', 'code', 'id'
    ]);

    // Skip leading time/filler tokens like "4", "4:30", "5pm", "at", "pm", "today"
    const isTimeOrFillerToken = (w: string) => {
      const clean = w.toLowerCase().replace(/[^a-z0-9:.]/g, '');
      if (!clean) return true;
      if (/^\d{1,2}(?:[:.]\d{2})?$/.test(clean)) return true;
      if (/^\d{1,2}(?:[:.]\d{2})?(?:am|pm)$/i.test(clean)) return true;
      if (['at', 'around', 'on', 'in', 'from', 'to', 'today', 'yesterday', 'tomorrow', 'am', 'pm', 'a.m.', 'p.m.', 'am.', 'pm.'].includes(clean)) return true;
      return false;
    };

    let startIndex = 0;
    while (startIndex < rawWords.length && isTimeOrFillerToken(rawWords[startIndex])) {
      startIndex++;
    }

    const words = rawWords.slice(startIndex);
    let candidateName = '';
    let consumedCount = 0;

    // Check 2-word candidate (e.g. "Board Games", "Video Editing")
    if (words.length >= 2) {
      const w1 = words[0].replace(/[^a-zA-Z0-9]/g, '');
      const w2 = words[1].replace(/[^a-zA-Z0-9]/g, '');
      const w1Lower = w1.toLowerCase();
      const w2Lower = w2.toLowerCase();
      if (
        w1.length >= 2 && w2.length >= 2 &&
        !stopWords.has(w1Lower) && !stopWords.has(w2Lower) &&
        isNaN(Number(w1)) && isNaN(Number(w2))
      ) {
        candidateName = `${capitalizeFirst(w1Lower)} ${capitalizeFirst(w2Lower)}`;
        consumedCount = 2;
      }
    }

    // Check 1-word candidate (e.g. "Gameplay", "Reading", "Study")
    if (!candidateName && words.length >= 1) {
      const w1 = words[0].replace(/[^a-zA-Z0-9]/g, '');
      const w1Lower = w1.toLowerCase();
      if (w1.length >= 2 && !stopWords.has(w1Lower) && isNaN(Number(w1))) {
        candidateName = capitalizeFirst(w1Lower);
        consumedCount = 1;
      }
    }

    if (candidateName) {
      const generatedCode = generateActivityCode(candidateName);
      matchedTemplate = {
        id: `custom_${Date.now()}`,
        code: generatedCode,
        name: candidateName,
        points: 10
      };
      isNewActivity = true;
      for (let i = 0; i < consumedCount; i++) {
        consumedPieces.push(words[i]);
      }
    }
  }

  // 6. Time parsing: Range detection ("from X to Y", "X to Y")
  let fromTime: string | undefined;
  let toTime: string | undefined;
  let isLongEvent = false;

  const rangeRegex = /(?:from\s+)?(\d{1,2}(?:[:.]\d{2})?)\s*(a\.?\s*m\.?|p\.?\s*m\.?|in the morning|in the evening|in the afternoon|at night)?\s*(?:to|till|until|-)\s*(\d{1,2}(?:[:.]\d{2})?)\s*(a\.?\s*m\.?|p\.?\s*m\.?|in the morning|in the evening|in the afternoon|at night)?/i;
  const rangeMatch = text.match(rangeRegex);

  const normalizeMod = (m?: string): 'am' | 'pm' | undefined => {
    if (!m) return undefined;
    const cleanM = m.toLowerCase().replace(/[\s.]/g, '');
    if (cleanM.includes('pm') || cleanM.includes('evening') || cleanM.includes('afternoon') || cleanM.includes('night')) return 'pm';
    if (cleanM.includes('am') || cleanM.includes('morning')) return 'am';
    return undefined;
  };

  if (rangeMatch) {
    const rawStart = rangeMatch[1];
    let startMod = rangeMatch[2]?.toLowerCase();
    const rawEnd = rangeMatch[3];
    let endMod = rangeMatch[4]?.toLowerCase();

    const normStartMod = normalizeMod(startMod);
    const normEndMod = normalizeMod(endMod);
    const effectiveStartMod = normStartMod || normEndMod;

    const parsedStart = parseSpokenTimeTo24Hour(rawStart, effectiveStartMod);
    const parsedEnd = parseSpokenTimeTo24Hour(rawEnd, normEndMod || normStartMod);

    if (parsedStart && parsedEnd) {
      fromTime = parsedStart;
      toTime = parsedEnd;
      isLongEvent = true;
      consumedPieces.push(rangeMatch[0]);
    }
  }

  // Single Time: supports "at 5:15 a.m.", "4 am yoga 15", "5 am running 10", "12 pm Lunch 5"
  if (!fromTime) {
    const singleTimeRegex = /(?:(?:at|around)\s+)?(\d{1,2}(?:[:.]\d{2})?)\s*(a\.?\s*m\.?|p\.?\s*m\.?|in the morning|in the evening|in the afternoon|at night)\b/i;
    const singleWithAtRegex = /(?:at|around)\s+(\d{1,2}(?:[:.]\d{2})?)/i;

    const singleMatch = text.match(singleTimeRegex) || text.match(singleWithAtRegex);
    if (singleMatch) {
      const raw = singleMatch[1];
      const mod = singleMatch[2];
      const normMod = normalizeMod(mod);
      const parsed = parseSpokenTimeTo24Hour(raw, normMod);
      if (parsed) {
        fromTime = parsed;
        consumedPieces.push(singleMatch[0]);
      }
    }
  }

  if (!fromTime) {
    fromTime = currentTimeStr;
  }

  if (matchedTemplate?.code === 'S' && !isLongEvent) {
    if (text.includes('hour') || text.includes('night') || text.includes('slept')) {
      isLongEvent = true;
      toTime = fromTime;
      fromTime = '23:00';
    }
  }

  // 7. Date parsing ("today", "yesterday", "tomorrow")
  let fromDate = todayStr;
  let toDate: string | undefined = isLongEvent ? todayStr : undefined;

  if (text.includes('yesterday')) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    fromDate = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
    if (isLongEvent) toDate = fromDate;
    consumedPieces.push('yesterday');
  } else if (text.includes('tomorrow')) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    fromDate = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    if (isLongEvent) toDate = fromDate;
    consumedPieces.push('tomorrow');
  } else if (text.includes('today')) {
    consumedPieces.push('today');
  }

  // 8. Cash transactions (Debit AND Credit)
  let debit: number | undefined;
  let credit: number | undefined;

  const debitRegex = /(?:debit|spent|spend|paid|pay|cost|expense|minus)\s*(?:of|is|worth|for)?\s*(?:rs\.?|inr|\$|€|£)?\s*(\d+(?:\.\d{1,2})?)/i;
  const debitAltRegex = /(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|\$|€|£|rupees|dollars|bucks)?\s*(?:debit|spent|expense)/i;
  const debitMatch = text.match(debitRegex) || text.match(debitAltRegex);

  if (debitMatch) {
    debit = parseFloat(debitMatch[1]);
    consumedPieces.push(debitMatch[0]);
    if (!matchedTemplate) {
      matchedTemplate = templatePool.find(t => t.code === 'Db');
    }
  }

  const creditRegex = /(?:credit|credited|received|receive|earned|earn|salary|income|plus)\s*(?:of|is|worth|for)?\s*(?:rs\.?|inr|\$|€|£)?\s*(\d+(?:\.\d{1,2})?)/i;
  const creditAltRegex = /(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|\$|€|£|rupees|dollars|bucks)?\s*(?:credit|credited|income)/i;
  const creditMatch = text.match(creditRegex) || text.match(creditAltRegex);

  if (creditMatch) {
    credit = parseFloat(creditMatch[1]);
    consumedPieces.push(creditMatch[0]);
    if (!matchedTemplate && !debit) {
      matchedTemplate = templatePool.find(t => t.code === 'Cr');
    }
  }

  const isCashTransaction = !!((debit && debit > 0) || (credit && credit > 0));

  // 9. Points parsing (e.g., "Yoga 15", "Yoga 15 points", "Running 25", "+15 points")
  let points: number = matchedTemplate ? matchedTemplate.points : 10;
  let pointsExplicitlyFound = false;
  
  // Method A: Explicit phrases: "points 20", "20 points", "score 15", "+15"
  const pointsRegexA = /(?:points?|pts?|score)\s*(?:of|is|are|to)?\s*(\d+)/i;
  const pointsRegexB = /\b(\d+)\s*(?:points?|pts?|p\b)/i;
  const pointsRegexC = /(?:plus|\+)\s*(\d+)\s*(?:points?|pts?|p\b)?/i;
  
  const matchA = text.match(pointsRegexA);
  const matchB = text.match(pointsRegexB);
  const matchC = text.match(pointsRegexC);

  if (matchA && matchA[1]) {
    points = parseInt(matchA[1], 10);
    pointsExplicitlyFound = true;
    consumedPieces.push(matchA[0]);
  } else if (matchB && matchB[1]) {
    points = parseInt(matchB[1], 10);
    pointsExplicitlyFound = true;
    consumedPieces.push(matchB[0]);
  } else if (matchC && matchC[1]) {
    points = parseInt(matchC[1], 10);
    pointsExplicitlyFound = true;
    consumedPieces.push(matchC[0]);
  } else {
    // Word number points: "ten points", "twenty points", "fifteen points"
    const wordMatch = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|twenty-five|thirty|forty|fifty|hundred)\s+(?:points?|pts?)\b/i);
    if (wordMatch && wordMatch[1] && NUMBER_WORDS[wordMatch[1].toLowerCase()] !== undefined) {
      points = NUMBER_WORDS[wordMatch[1].toLowerCase()];
      pointsExplicitlyFound = true;
      consumedPieces.push(wordMatch[0]);
    }
  }

  // Method B: Activity name immediately followed by a number: "Yoga 15", "Running 20", "Gameplay 25"
  if (!pointsExplicitlyFound && matchedTemplate) {
    const actNameEscaped = matchedTemplate.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const actCodeEscaped = matchedTemplate.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const actFollowedByNumRegex = new RegExp(`\\b(?:${actNameEscaped}|${actCodeEscaped})\\s+(\\d{1,3})\\b`, 'i');
    const actNumMatch = text.match(actFollowedByNumRegex);
    
    if (actNumMatch && actNumMatch[1]) {
      const candidate = parseInt(actNumMatch[1], 10);
      if (matchedTemplate.code !== 'Db' && matchedTemplate.code !== 'Cr') {
        points = candidate;
        pointsExplicitlyFound = true;
        consumedPieces.push(actNumMatch[1]);
      } else if (candidate !== debit && candidate !== credit) {
        points = candidate;
        pointsExplicitlyFound = true;
        consumedPieces.push(actNumMatch[1]);
      }
    }

    if (!pointsExplicitlyFound && ACTIVITY_SYNONYMS[matchedTemplate.code]) {
      for (const syn of ACTIVITY_SYNONYMS[matchedTemplate.code]) {
        const synRegex = new RegExp(`\\b${syn}\\s+(\\d{1,3})\\b`, 'i');
        const synMatch = text.match(synRegex);
        if (synMatch && synMatch[1]) {
          const candidate = parseInt(synMatch[1], 10);
          if (matchedTemplate.code !== 'Db' && matchedTemplate.code !== 'Cr') {
            points = candidate;
            pointsExplicitlyFound = true;
            consumedPieces.push(synMatch[1]);
            break;
          } else if (candidate !== debit && candidate !== credit) {
            points = candidate;
            pointsExplicitlyFound = true;
            consumedPieces.push(synMatch[1]);
            break;
          }
        }
      }
    }
  }

  // Method C: Any isolated number in transcript that is not debit, credit, or time
  if (!pointsExplicitlyFound) {
    const allNums = Array.from(text.matchAll(/\b(\d{1,3})\b/g));
    for (const m of allNums) {
      const num = parseInt(m[1], 10);
      if (num === debit || num === credit) continue;
      if (fromTime && fromTime.startsWith(String(num).padStart(2, '0'))) continue;
      if (toTime && toTime.startsWith(String(num).padStart(2, '0'))) continue;
      if (num > 0 && num <= 100) {
        points = num;
        pointsExplicitlyFound = true;
        consumedPieces.push(m[0]);
        break;
      }
    }
  }

  // 10. Clean Description / Notes extraction
  // User explicitly instructed: "dont add the complte text to description. Arrage it like this Activity Point at Time to Time debit amount and / credit amount description"
  let description = '';
  let isDescriptionOpen = false;

  // Check for explicit "notes ...", "description ...", "story ..."
  const explicitNotesMatch = rawTranscript.match(/(?:notes?|description|details?|story)\s*(?:is|are|:|says)?\s*(.+)$/i);
  if (explicitNotesMatch && explicitNotesMatch[1]) {
    description = capitalizeFirst(explicitNotesMatch[1].trim());
    isDescriptionOpen = description.length > 0;
  } else {
    // Remove all recognized components from raw transcript
    let remaining = rawTranscript;
    for (const piece of consumedPieces) {
      if (!piece) continue;
      const escaped = piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefix = /^\w/.test(piece) ? '\\b' : '';
      const suffix = /\w$/.test(piece) ? '\\b' : '';
      remaining = remaining.replace(new RegExp(`${prefix}${escaped}${suffix}`, 'gi'), ' ');
    }

    // Clean up extra whitespace and leading punctuation/connector words
    let clean = remaining.replace(/\s+/g, ' ').trim();
    clean = clean.replace(/^(?:at|on|for|and|to|in|of)\s+/i, '').trim();

    // Only set as description if there is real descriptive content left (not just "at", "pm", "today", etc.)
    const isOnlyFiller = /^(?:today|yesterday|tomorrow|am|pm|a\.m\.?|p\.m\.?|hours?|hrs?|minutes?|mins?|pts?|points?|notes?)$/i.test(clean);
    if (clean.length >= 3 && !isOnlyFiller) {
      description = capitalizeFirst(clean);
      isDescriptionOpen = true;
    }
  }

  // Fallback template if none was found
  if (!matchedTemplate) {
    matchedTemplate = {
      id: `custom_${Date.now()}`,
      code: 'ACT',
      name: 'Activity',
      points: points || 10
    };
  }

  return {
    code: matchedTemplate.code,
    name: matchedTemplate.name,
    points: points ?? matchedTemplate.points,
    fromDate,
    fromTime,
    toDate: isLongEvent ? (toDate || fromDate) : undefined,
    toTime: isLongEvent ? (toTime || fromTime) : undefined,
    isLongEvent,
    debit: debit || 0,
    credit: credit || 0,
    isCashTransaction,
    moneyCode: detectedMoneyCode,
    description: isDescriptionOpen ? description : '',
    isDescriptionOpen,
    rawTranscript,
    isGoal,
    isNewActivity,
    matchedTemplate
  };
}
