import { dataStore, SyncMutation } from './dataStore';
import { syncApi } from '../api/syncApi';
import { attendanceApi } from '../api/attendanceApi';

type SyncCallback = (progress: string) => void;

class SyncManager {
  private syncing = false;
  private onProgress: SyncCallback | null = null;

  setProgressCallback(cb: SyncCallback) {
    this.onProgress = cb;
  }

  private progress(msg: string) {
    if (this.onProgress) this.onProgress(msg);
  }

  // Full sync: fetch everything and store in IndexedDB
  async fullSync(): Promise<boolean> {
    if (this.syncing) return false;
    this.syncing = true;
    this.progress('Starting sync...');
    try {
      const res = await syncApi.getFullSync();
      if (res.success && res.data) {
        await dataStore.saveSyncData(res.data);
        this.progress('Sync complete');
        return true;
      }
      this.progress('Sync failed');
      return false;
    } catch (err) {
      console.error('Full sync error:', err);
      this.progress('Sync failed — offline?');
      return false;
    } finally {
      this.syncing = false;
    }
  }

  // Process all queued mutations
  async processMutations(): Promise<{ success: number; failed: number }> {
    const mutations = await dataStore.getPendingMutations();
    if (mutations.length === 0) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    for (const mutation of mutations) {
      try {
        await this.executeMutation(mutation);
        await dataStore.removeMutation(mutation.id!);
        success++;
      } catch (err) {
        console.error('Mutation failed:', mutation, err);
        failed++;
      }
    }

    return { success, failed };
  }

  // Check if online and process sync
  async syncIfOnline(): Promise<void> {
    if (!navigator.onLine) return;
    await this.fullSync();
    await this.processMutations();
  }

  private async executeMutation(mutation: SyncMutation): Promise<void> {
    switch (mutation.type) {
      case 'check-in':
        await attendanceApi.checkIn(mutation.payload);
        break;
      case 'check-out':
        await attendanceApi.checkOut(mutation.payload);
        break;
      default:
        throw new Error(`Unknown mutation type: ${mutation.type}`);
    }
  }
}

export const syncManager = new SyncManager();
