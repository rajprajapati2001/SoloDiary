
export interface ActivityEntry {
  id: string;
  isLongEvent: boolean;
  fromDate: string | null;
  fromTime: string | null;
  toDate: string;
  toTime: string;
  code: string;
  name: string;
  points: number;
  description: string;
  attachment: string;
  debit?: number;
  credit?: number;
  createdAt: number;
}

export interface Goal {
  id: string;
  deadlineMonth: string;
  deadlineYear: number;
  code: string;
  name: string;
  points: number;
  achievedAt?: string; // date string
  createdAt?: number;
}

export interface ActivityTemplate {
  id: string;
  code: string;
  points: number;
  name: string;
}

export interface AutoTemplate {
  id: string;
  isLongEvent: boolean;
  fromTime: string | null;
  toTime: string;
  code: string;
  name: string;
  points: number;
  description: string;
  attachment: string;
  debit?: number;
  credit?: number;
  isEnabled: boolean;
}


export type Page = 'home' | 'activities' | 'goals' | 'diary' | 'auto' | 'chart';

export interface DailyStats {
  date: string;
  points: number;
}
