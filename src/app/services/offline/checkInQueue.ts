import { dataStore, SyncMutation } from './dataStore';

interface PendingAction {
  id?: number;
  type: 'check-in' | 'check-out';
  payload: any;
  createdAt: string;
  retryCount: number;
}

export const offlineQueue = {
  async add(action: Omit<PendingAction, 'id' | 'retryCount'>): Promise<void> {
    await dataStore.queueMutation({
      type: action.type,
      entity: 'attendance',
      entityId: undefined,
      payload: action.payload,
    });
  },

  async getAll(): Promise<PendingAction[]> {
    const mutations = await dataStore.getPendingMutations();
    return mutations.map(m => ({
      id: m.id,
      type: m.type as 'check-in' | 'check-out',
      payload: m.payload,
      createdAt: m.createdAt,
      retryCount: m.retryCount,
    }));
  },

  async getCount(): Promise<number> {
    return dataStore.getMutationCount();
  },

  async remove(id: number): Promise<void> {
    await dataStore.removeMutation(id);
  },

  async incrementRetry(id: number): Promise<void> {
    await dataStore.incrementMutationRetry(id);
  },

  async clear(): Promise<void> {
    await dataStore.clearMutations();
  }
};
