
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SoloDiaryDB';
const DB_VERSION = 2; // Increment version for new store

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('entries', { keyPath: 'id' });
        db.createObjectStore('goals', { keyPath: 'id' });
        db.createObjectStore('activity_templates', { keyPath: 'id' });
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      }
    },
  });
};

export const getDB = async () => await initDB();
