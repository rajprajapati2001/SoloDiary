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

interface AssistantActionsPlugin {
  checkLaunchIntent(): Promise<{ openForm?: boolean; openVoice?: boolean }>;
  addListener(eventName: 'addRecord', listener: (record: AssistantRecordInput) => void): Promise<{ remove: () => Promise<void> }>;
  addListener(eventName: 'openAddEntry', listener: (data: { openForm?: boolean }) => void): Promise<{ remove: () => Promise<void> }>;
  addListener(eventName: 'openVoiceFill', listener: (data: { openVoice?: boolean }) => void): Promise<{ remove: () => Promise<void> }>;
}

export const AssistantActions = registerPlugin<AssistantActionsPlugin>('AssistantActions');