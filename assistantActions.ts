import { registerPlugin } from '@capacitor/core';

export interface AssistantRecordInput {
  activity?: string;
  name?: string;
  code?: string;
  points?: number | string;
  cash?: number | string;
  debit?: number | string;
  credit?: number | string;
  currency?: string;
  description?: string;
  date?: string;
  time?: string;
  secondTime?: string;
  toDate?: string;
  toTime?: string;
}

export interface WidgetDataInput {
  todayPoints?: number;
  todayTarget?: number;
  todayDate?: string;
  todayProgress?: number;
  monthPoints?: number;
  monthTarget?: number;
  monthName?: string;
  monthProgress?: number;
  timelineData?: string;
  timelineCount?: number;
  todayActivitiesJson?: string;
  todayTotalDebit?: number;
  todayTotalCredit?: number;
  todayDateFull?: string;
  currencySymbol?: string;
  monthSpaceName?: string;
}

interface AssistantActionsPlugin {
  checkLaunchIntent(): Promise<{ openForm?: boolean; openVoice?: boolean }>;
  updateWidgetData(data: WidgetDataInput): Promise<void>;
  addListener(eventName: 'addRecord', listener: (record: AssistantRecordInput) => void): Promise<{ remove: () => Promise<void> }>;
  addListener(eventName: 'openAddEntry', listener: (data: { openForm?: boolean }) => void): Promise<{ remove: () => Promise<void> }>;
  addListener(eventName: 'openVoiceFill', listener: (data: { openVoice?: boolean }) => void): Promise<{ remove: () => Promise<void> }>;
}

export const AssistantActions = registerPlugin<AssistantActionsPlugin>('AssistantActions');