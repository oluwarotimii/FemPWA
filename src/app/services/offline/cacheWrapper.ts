import { dataStore, StoreName } from './dataStore';

const CACHE_TTL = 5 * 60 * 1000;

type ApiCall<T> = () => Promise<{ success: boolean; data?: T; message?: string }>;

export async function cachedGet<T>(
  storeName: StoreName,
  apiCall: ApiCall<T>,
  ttl: number = CACHE_TTL,
): Promise<{ success: boolean; data?: T; message?: string; fromCache: boolean }> {
  const cached = await dataStore.get<T>(storeName);

  if (cached && Date.now() - cached.timestamp < ttl) {
    return { success: true, data: cached.data, fromCache: true };
  }

  try {
    const response = await apiCall();
    if (response.success && response.data !== undefined) {
      await dataStore.put(storeName, response.data);
    }
    return { ...response, fromCache: false };
  } catch (err) {
    if (cached) {
      return { success: true, data: cached.data, fromCache: true };
    }
    return { success: false, message: 'Request failed and no cached data available', fromCache: false };
  }
}
