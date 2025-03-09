// Service for local storage management

// Use localStorage for persistent storage
const localStore = {
  setItem: (key: string, value: any): void => {
    try {
      // Ensure we're only storing serializable data
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error storing ${key} in localStorage:`, error);
      // If localStorage fails (e.g., quota exceeded), try sessionStorage as fallback
      try {
        const serializedValue = JSON.stringify(value);
        sessionStorage.setItem(key, serializedValue);
      } catch (fallbackError) {
        console.error(`Fallback to sessionStorage also failed for ${key}:`, fallbackError);
      }
    }
  },
  
  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item) as T;
      }
      
      // If not in localStorage, try sessionStorage
      const sessionItem = sessionStorage.getItem(key);
      return sessionItem ? JSON.parse(sessionItem) as T : null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key); // Also remove from sessionStorage if it exists there
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};

// Use sessionStorage for temporary storage
const sessionStore = {
  setItem: (key: string, value: any): void => {
    try {
      // Ensure we're only storing serializable data
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error storing ${key} in sessionStorage:`, error);
    }
  },
  
  getItem: <T>(key: string): T | null => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      console.error(`Error retrieving ${key} from sessionStorage:`, error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from sessionStorage:`, error);
    }
  },
  
  clear: (): void => {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing session storage:', error);
    }
  }
};

// Storage keys
export const STORAGE_KEYS = {
  USER: 'user_data',
  SPEAKERS: 'speakers_data',
  EVENTS: 'events_data',
  LAST_UPDATED: 'last_updated',
  OFFLINE_MODE: 'offline_mode'
};

// Helper function to clean objects for storage
function cleanObjectForStorage(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => cleanObjectForStorage(item));
  }
  
  const cleanObject = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      
      // Skip functions, symbols, and other non-serializable types
      if (typeof value === 'function' || typeof value === 'symbol') {
        continue;
      }
      
      // Recursively clean nested objects
      if (typeof value === 'object' && value !== null) {
        cleanObject[key] = cleanObjectForStorage(value);
      } else {
        cleanObject[key] = value;
      }
    }
  }
  
  return cleanObject;
}

// Storage functions
export const saveToLocalStorage = async <T>(key: string, data: T): Promise<void> => {
  try {
    const safeData = JSON.parse(JSON.stringify(data));
    localStore.setItem(key, safeData);
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    
    // Try a more careful approach if JSON.stringify fails
    try {
      // Create a clean object without non-serializable values
      const cleanData = cleanObjectForStorage(data);
      localStore.setItem(key, cleanData);
    } catch (fallbackError) {
      console.error(`Fallback cleaning also failed for ${key}:`, fallbackError);
    }
  }
};

export const getFromLocalStorage = async <T>(key: string): Promise<T | null> => {
  return localStore.getItem<T>(key);
};

export const removeFromLocalStorage = async (key: string): Promise<void> => {
  localStore.removeItem(key);
};

export const saveToSessionStorage = async <T>(key: string, data: T): Promise<void> => {
  try {
    const safeData = JSON.parse(JSON.stringify(data));
    sessionStore.setItem(key, safeData);
  } catch (error) {
    console.error(`Error saving to sessionStorage (${key}):`, error);
    
    // Try a more careful approach if JSON.stringify fails
    try {
      // Create a clean object without non-serializable values
      const cleanData = cleanObjectForStorage(data);
      sessionStore.setItem(key, cleanData);
    } catch (fallbackError) {
      console.error(`Fallback cleaning also failed for ${key}:`, fallbackError);
    }
  }
};

export const getFromSessionStorage = async <T>(key: string): Promise<T | null> => {
  return sessionStore.getItem<T>(key);
};

// Clear function - preserves user data
export const clearLocalStorage = async (): Promise<void> => {
  try {
    // Keep user data
    const userData = localStore.getItem(STORAGE_KEYS.USER);
    const offlineMode = localStore.getItem(STORAGE_KEYS.OFFLINE_MODE);
    
    // Clear everything
    localStore.clear();
    
    // Restore user data if it existed
    if (userData) {
      localStore.setItem(STORAGE_KEYS.USER, userData);
    }
    
    // Restore offline mode setting if it existed
    if (offlineMode !== null) {
      localStore.setItem(STORAGE_KEYS.OFFLINE_MODE, offlineMode);
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

// Get last updated timestamp
export const getLastUpdated = async (): Promise<string | null> => {
  return localStore.getItem<string>(STORAGE_KEYS.LAST_UPDATED);
};

// Set last updated timestamp
export const setLastUpdated = async (): Promise<void> => {
  localStore.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
};

// Function to reload the page with a cache-busting parameter
export const forceFullCacheReset = async (): Promise<void> => {
  try {
    // Clear all cached data first
    const userData = localStore.getItem(STORAGE_KEYS.USER);
    const offlineMode = localStore.getItem(STORAGE_KEYS.OFFLINE_MODE);
    
    // Clear everything from both storages
    localStorage.clear();
    sessionStorage.clear();
    
    // Restore only essential user data
    if (userData) {
      localStore.setItem(STORAGE_KEYS.USER, userData);
    }
    
    if (offlineMode !== null) {
      localStore.setItem(STORAGE_KEYS.OFFLINE_MODE, offlineMode);
    }
    
    // Add a cache-busting parameter to the URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('t', Date.now().toString());
    window.location.href = newUrl.toString();
  } catch (error) {
    console.error('Error reloading page:', error);
    throw error;
  }
};

// Function to check if storage is available
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Function to get storage usage information
export const getStorageInfo = (): { 
  available: boolean; 
  usedSpace: string; 
  totalSpace?: string;
  items: number;
} => {
  try {
    // Check if storage is available
    const available = isStorageAvailable();
    
    if (!available) {
      return { 
        available: false, 
        usedSpace: '0 KB',
        items: 0
      };
    }
    
    // Calculate used space
    let totalSize = 0;
    let itemCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
          itemCount++;
        }
      }
    }
    
    // Convert to KB
    const usedKB = (totalSize / 1024).toFixed(2);
    
    return {
      available: true,
      usedSpace: `${usedKB} KB`,
      items: itemCount
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return {
      available: false,
      usedSpace: 'Error',
      items: 0
    };
  }
};