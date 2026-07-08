const DB_NAME = 'femhr-cache';
const DB_VERSION = 2;

export const STORE_NAMES = [
  'syncMeta',
  'mutations',
  'user',
  'staff',
  'permissions',
  'branchInfo',
  'branchWorkingDays',
  'locations',
  'attendance',
  'todayShift',
  'shiftExceptions',
  'holidays',
  'leaveBalance',
  'departments',
  'branches',
  'attendanceSettings',
] as const;

export type StoreName = typeof STORE_NAMES[number];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORE_NAMES.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name);
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface SyncMutation {
  id?: number;
  type: string;
  entity: string;
  entityId?: number;
  payload: any;
  createdAt: string;
  retryCount: number;
}

export const dataStore = {
  // ── Single entity helpers ──

  async put<T>(storeName: StoreName, data: T): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put({ data, timestamp: Date.now() }, '_main');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  async get<T>(storeName: StoreName): Promise<{ data: T; timestamp: number } | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get('_main');
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  },

  async remove(storeName: StoreName): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete('_main');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  async clear(): Promise<void> {
    const db = await openDB();
    return Promise.all(STORE_NAMES.map(name =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(name, 'readwrite');
        tx.objectStore(name).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
    )).then(() => { db.close(); });
  },

  // ── Bulk save from full sync ──

  async saveSyncData(data: Record<string, any>): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAMES, 'readwrite');
    const entries: [StoreName, any][] = [
      ['user', data.user],
      ['staff', data.staff],
      ['permissions', data.permissions],
      ['branchInfo', data.branchInfo],
      ['branchWorkingDays', data.branchWorkingDays],
      ['locations', data.assignedLocations],
      ['attendance', data.attendance],
      ['todayShift', data.todayShift],
      ['shiftExceptions', data.shiftExceptions],
      ['holidays', data.holidays],
      ['leaveBalance', data.leaveBalance],
      ['departments', data.departments],
      ['branches', data.branches],
      ['attendanceSettings', data.attendanceSettings],
    ];
    for (const [store, value] of entries) {
      if (value !== undefined && value !== null) {
        tx.objectStore(store).put({ data: value, timestamp: Date.now() }, '_main');
      }
    }
    // Store sync timestamp
    tx.objectStore('syncMeta').put({ data: { lastSyncAt: data.serverTime || new Date().toISOString() }, timestamp: Date.now() }, '_main');
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  // ── Mutations queue ──

  async queueMutation(mutation: Omit<SyncMutation, 'id' | 'createdAt' | 'retryCount'>): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readwrite');
      const item: SyncMutation = { ...mutation, createdAt: new Date().toISOString(), retryCount: 0 };
      tx.objectStore('mutations').add(item);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  async getPendingMutations(): Promise<SyncMutation[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readonly');
      const request = tx.objectStore('mutations').getAll();
      request.onsuccess = () => { db.close(); resolve(request.result || []); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  },

  async getMutationCount(): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readonly');
      const request = tx.objectStore('mutations').count();
      request.onsuccess = () => { db.close(); resolve(request.result); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  },

  async removeMutation(id: number): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readwrite');
      tx.objectStore('mutations').delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  async clearMutations(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('mutations', 'readwrite');
      tx.objectStore('mutations').clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  },

  // ── Sync timestamp ──

  async getLastSyncTime(): Promise<string | null> {
    const entry = await this.get<{ lastSyncAt: string }>('syncMeta');
    return entry?.data?.lastSyncAt || null;
  },
};
