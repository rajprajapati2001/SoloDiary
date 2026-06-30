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

/**
 * Utility function to clean objects before persistence.
 * Removes empty string, zero, false, null, and undefined properties to minimize DB size.
 */
const cleanObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach((key) => {
    const value = cleaned[key];
    if (value === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// Compatibility wrapper matching the idb API used in the application
export const getDB = async (): Promise<any> => {
  return {
    getAll: async (storeName: string): Promise<any[]> => {
      if (storeName === 'entries') {
        return await dexieDB.entries.toArray();
      }
      if (storeName === 'goals') {
        return await dexieDB.goals.toArray();
      }
      if (storeName === 'activity_templates') {
        return await dexieDB.activity_templates.toArray();
      }
      if (storeName === 'auto_templates') {
        return await dexieDB.auto_templates.toArray();
      }
      if (storeName === 'settings') {
        return await dexieDB.settings.toArray();
      }
      return [];
    },

    get: async (storeName: string, key: string): Promise<any> => {
      if (storeName === 'settings') {
        return await dexieDB.settings.get(key);
      }
      if (storeName === 'entries') {
        return await dexieDB.entries.get(key);
      }
      if (storeName === 'goals') {
        return await dexieDB.goals.get(key);
      }
      if (storeName === 'activity_templates') {
        return await dexieDB.activity_templates.get(key);
      }
      if (storeName === 'auto_templates') {
        return await dexieDB.auto_templates.get(key);
      }
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
        return await dexieDB.entries.put(optimizedValue);
      }
      if (storeName === 'goals') {
        return await dexieDB.goals.put(optimizedValue);
      }
      if (storeName === 'activity_templates') {
        return await dexieDB.activity_templates.put(optimizedValue);
      }
      if (storeName === 'auto_templates') {
        return await dexieDB.auto_templates.put(optimizedValue);
      }
    },

    delete: async (storeName: string, key: string): Promise<any> => {
      if (storeName === 'settings') {
        return await dexieDB.settings.delete(key);
      }
      if (storeName === 'entries') {
        return await dexieDB.entries.delete(key);
      }
      if (storeName === 'goals') {
        return await dexieDB.goals.delete(key);
      }
      if (storeName === 'activity_templates') {
        return await dexieDB.activity_templates.delete(key);
      }
      if (storeName === 'auto_templates') {
        return await dexieDB.auto_templates.delete(key);
      }
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
               // Clean data in transactions as well
               const optimizedValue = cleanObject(value);
               
               if (storeName === 'entries') {
                 p = dexieDB.entries.put(optimizedValue);
               } else if (storeName === 'goals') {
                 p = dexieDB.goals.put(optimizedValue);
               } else if (storeName === 'activity_templates') {
                 p = dexieDB.activity_templates.put(optimizedValue);
               } else if (storeName === 'auto_templates') {
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