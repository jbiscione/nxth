import axios from 'axios';
import { getFromLocalStorage, saveToLocalStorage } from './localStorageService';

// Storage keys
const CONFIG_STORAGE_KEY = 'config_data';
const CONFIG_LAST_UPDATED_KEY = 'config_last_updated';

interface ConfigData {
  version: string;
  day: string;
  features?: string[];
}

// External config URL
const EXTERNAL_CONFIG_API = '/api/external/nexthumans_version.json';

export const loadConfigFromAPI = async (): Promise<{
  config: ConfigData | null;
  success: boolean;
  message: string;
}> => {
  try {
    console.log('Attempting to fetch config from external API...');
    
    const response = await axios.get(EXTERNAL_CONFIG_API, {
      timeout: 15000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      params: {
        _t: new Date().getTime()
      }
    });
    
    if (!response.data) {
      throw new Error('Invalid data format from API');
    }
    
    const config: ConfigData = {
      version: response.data.version || '1.0.0',
      day: response.data.day || '1',
      features: response.data.features || []
    };
    
    // Save to storage
    await saveToLocalStorage(CONFIG_STORAGE_KEY, config);
    await saveToLocalStorage(CONFIG_LAST_UPDATED_KEY, new Date().toISOString());
    
    return {
      config,
      success: true,
      message: 'Config loaded successfully'
    };
  } catch (error) {
    console.error('Error loading config from API:', error);
    return {
      config: null,
      success: false,
      message: `Error loading config: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

export const getConfig = async (): Promise<ConfigData | null> => {
  try {
    // Try to get from storage first
    const storedConfig = await getFromLocalStorage<ConfigData>(CONFIG_STORAGE_KEY);
    if (storedConfig) {
      return storedConfig;
    }
    
    // If not in storage, load from API
    const result = await loadConfigFromAPI();
    return result.config;
  } catch (error) {
    console.error('Error getting config:', error);
    return null;
  }
};