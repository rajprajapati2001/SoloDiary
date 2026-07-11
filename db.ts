import Dexie, { Table } from 'dexie';
import { ActivityEntry, Goal, ActivityTemplate, AutoTemplate } from './types';

const DB_NAME = 'SoloDiaryDB';
const DB_VERSION = 3;

class SoloDiaryDatabase extends Dexie {
  entries!: Table<ActivityEntry, string>;
  goals!: Table<Goal, string>;
  activity_templates!: Table<ActivityTemplate, string>;
  auto_templates!: Table<AutoTemplate, string>;
  settings!: Table<any, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      entries: 'id', // Only 'id' is indexed. Schemaless properties fit perfectly.
      goals: 'id',
      activity_templates: 'id',
      auto_templates: 'id',
      settings: ''   // Out-of-line keys
    });
  }
}

export const dexieDB = new SoloDiaryDatabase();

const cleanObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key];
    // Strips out undefined, null, empty strings, 0, and false
    if (value === undefined || value === null || value === '' || value === 0 || value === false) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

const generateId = async (table: Table<any, string>): Promise<string> => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`;

  // Count existing records to calculate the next sequence number
  const count = await table.count();
  const sequence = String(count + 1).padStart(4, '0');

  return `${dateStr}-${sequence}`;
};

export const getDB = async (): Promise<any> => {
  return {
    getAll: async (storeName: string): Promise<any[]> => {
      let results: any[] = [];
      
      if (storeName === 'entries') results = await dexieDB.entries.toArray();
      else if (storeName === 'goals') results = await dexieDB.goals.toArray();
      else if (storeName === 'activity_templates') results = await dexieDB.activity_templates.toArray();
      else if (storeName === 'auto_templates') results = await dexieDB.auto_templates.toArray();
      else if (storeName === 'settings') results = await dexieDB.settings.toArray();
      else return [];

      // Sort with oldest on top, newest at the bottom
      return results.sort((a, b) => {
        if (a.timestamp && b.timestamp) return a.timestamp - b.timestamp;
        return a.id && b.id ? a.id.localeCompare(b.id) : 0;
      });
    },

    get: async (storeName: string, key: string): Promise<any> => {
      if (storeName === 'settings') return await dexieDB.settings.get(key);
      if (storeName === 'entries') return await dexieDB.entries.get(key);
      if (storeName === 'goals') return await dexieDB.goals.get(key);
      if (storeName === 'activity_templates') return await dexieDB.activity_templates.get(key);
      if (storeName === 'auto_templates') return await dexieDB.auto_templates.get(key);
      return undefined;
    },

    put: async (storeName: string, value: any, key?: string): Promise<any> => {
      if (storeName === 'settings') {
        if (!key) throw new Error('Key is required for out-of-line settings table');
        return await dexieDB.settings.put(value, key);
      }
      
      // Clean data before storing to reduce offline footprint
      const optimizedValue = cleanObject(value);

      if (storeName === 'entries') {
        if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.entries);
        return await dexieDB.entries.put(optimizedValue);
      }
      if (storeName === 'goals') {
        if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.goals);
        return await dexieDB.goals.put(optimizedValue);
      }
      if (storeName === 'activity_templates') {
        if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.activity_templates);
        return await dexieDB.activity_templates.put(optimizedValue);
      }
      if (storeName === 'auto_templates') {
        if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.auto_templates);
        return await dexieDB.auto_templates.put(optimizedValue);
      }
    },

    delete: async (storeName: string, key: string): Promise<any> => {
      if (storeName === 'settings') return await dexieDB.settings.delete(key);
      if (storeName === 'entries') return await dexieDB.entries.delete(key);
      if (storeName === 'goals') return await dexieDB.goals.delete(key);
      if (storeName === 'activity_templates') return await dexieDB.activity_templates.delete(key);
      if (storeName === 'auto_templates') return await dexieDB.auto_templates.delete(key);
    },

    transaction: (storeName: string, mode: string) => {
      const putsWaiting: Promise<any>[] = [];
      return {
         store: {
           put: async (value: any, key?: any) => {
             let p;
             if (storeName === 'settings') {
               if (!key) throw new Error('Key is required for settings table transaction');
               p = dexieDB.settings.put(value, key);
             } else {
               const optimizedValue = cleanObject(value);
               
               if (storeName === 'entries') {
                 if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.entries);
                 p = dexieDB.entries.put(optimizedValue);
               } else if (storeName === 'goals') {
                 if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.goals);
                 p = dexieDB.goals.put(optimizedValue);
               } else if (storeName === 'activity_templates') {
                 if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.activity_templates);
                 p = dexieDB.activity_templates.put(optimizedValue);
               } else if (storeName === 'auto_templates') {
                 if (!optimizedValue.id) optimizedValue.id = await generateId(dexieDB.auto_templates);
                 p = dexieDB.auto_templates.put(optimizedValue);
               }
             }
             
             if (p) {
               putsWaiting.push(p);
             }
             return p;
           }
         },
         get done() {
           return Promise.all(putsWaiting).then(() => {});
         }
      };
    }
  };
};