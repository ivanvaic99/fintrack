import Dexie from 'dexie';

// FinTrack database stores transactions. Each record includes
// category, amount, date, type and optional notes. Indexed on date
// for efficient range queries.
export const db = new Dexie('fintrack');
db.version(1).stores({
  transactions: '++id, date, category, type, amount',
});