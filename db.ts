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
      entries: 'id',
      goals: 'id',
      activity_templates: 'id',
      auto_templates: 'id',
      settings: '' // Out-of-line keys
    });
  }
}

export const dexieDB = new SoloDiaryDatabase();

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
      if (storeName === 'entries') {
        return await dexieDB.entries.put(value);
      }
      if (storeName === 'goals') {
        return await dexieDB.goals.put(value);
      }
      if (storeName === 'activity_templates') {
        return await dexieDB.activity_templates.put(value);
      }
      if (storeName === 'auto_templates') {
        return await dexieDB.auto_templates.put(value);
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
             } else if (storeName === 'entries') {
               p = dexieDB.entries.put(value);
             } else if (storeName === 'goals') {
               p = dexieDB.goals.put(value);
             } else if (storeName === 'activity_templates') {
               p = dexieDB.activity_templates.put(value);
             } else if (storeName === 'auto_templates') {
               p = dexieDB.auto_templates.put(value);
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
