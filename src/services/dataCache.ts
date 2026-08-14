// Global Data Cache Service
// Caches successful API responses per tab to prevent refetch on tab switch
// Cache is updated by 15-second polling only
// Cache never expires - only replaced by new successful HTTP 200 responses

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataCacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  // Get cached data for a specific key
  // Returns cached data regardless of age (no expiration)
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry) {
      return entry.data as T;
    }
    return null;
  }

  // Check if data exists in cache
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Set cache data (only called on successful HTTP 200 responses)
  // Replaces existing cache with new data - never expires
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache for a specific key
  clear(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
  }

  // Check if a request is pending for a specific key
  isPending(key: string): boolean {
    return this.pendingRequests.has(key);
  }

  // Set a pending request
  setPending<T>(key: string, promise: Promise<T>): void {
    this.pendingRequests.set(key, promise);
    
    // Clean up pending request when it completes
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  // Get pending request
  getPending<T>(key: string): Promise<T> | null {
    return this.pendingRequests.get(key) || null;
  }

  // Clear pending request
  clearPending(key: string): void {
    this.pendingRequests.delete(key);
  }
}

// Export singleton instance
export const dataCache = new DataCacheService();

// Cache key generators for each tab
export const cacheKeys = {
  reservations: {
    stays: () => 'reservations:stays',
    rooms: () => 'reservations:rooms',
    roomCategories: () => 'reservations:roomCategories',
    reservationRequests: () => 'reservations:reservationRequests',
  },
  rooms: {
    rooms: (filter: string, floor: number | 'all') => `rooms:rooms:${filter}:${floor}`,
    roomCategories: () => 'rooms:roomCategories',
  },
  specialOffers: {
    offers: () => 'specialOffers:offers',
  },
  aiAssistant: {
    // AI assistant doesn't have persistent data to cache
  },
};
