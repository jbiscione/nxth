import { Speaker } from '../types';
import { getFromLocalStorage, saveToLocalStorage } from './localStorageService';
import Papa from 'papaparse';
import axios from 'axios';

// Storage keys
const SPEAKERS_STORAGE_KEY = 'speakers_data';
const SPEAKERS_LAST_UPDATED_KEY = 'speakers_last_updated';
const SPEAKERS_SOURCE_KEY = 'speakers_data_source';

// External API URL - using proxy to avoid CORS issues
const EXTERNAL_SPEAKERS_API = '/api/external/Speakers.json';

// Function to load speakers from external API
export const loadSpeakersFromExternalAPI = async (): Promise<{
  speakers: Speaker[];
  success: boolean;
  message: string;
  source: string;
}> => {
  try {
    console.log('Attempting to fetch speakers from external API via proxy...');
    console.log('Sending request to:', EXTERNAL_SPEAKERS_API);
    
    // Fetch data from external API through the proxy
    const response = await axios.get(EXTERNAL_SPEAKERS_API, {
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      params: {
        _t: new Date().getTime() // Add timestamp to prevent caching
      }
    });
    
    console.log('Received response from:', EXTERNAL_SPEAKERS_API + '?_t=' + new Date().getTime(), 'Status:', response.status);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid data format from external API:', response.data);
      throw new Error('Invalid data format from external API');
    }
    
    // Map API data to Speaker objects - ensure all values are serializable
    const speakers = response.data.map((item: any, index: number) => {
      // Create a clean object with only the properties we need
      // This prevents any non-serializable values from being included
      const cleanSpeaker: Speaker = {
        id: typeof item.id === 'number' ? item.id : index + 1,
        name: typeof item.name === 'string' ? item.name : 'Speaker Desconocido',
        role: typeof item.role === 'string' ? item.role : '',
        bio: typeof item.bio === 'string' ? item.bio : '',
        activity: typeof item.activity === 'string' ? item.activity : '',
        imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
        linkedinUrl: typeof item.linkedinUrl === 'string' ? item.linkedinUrl : '',
        instagramUrl: typeof item.instagramUrl === 'string' ? item.instagramUrl : '',
        presentation: typeof item.presentation === 'string' ? item.presentation : '' // Add presentation URL mapping
      };
      
      // Log the speaker data for debugging
      console.log(`Processing speaker ${cleanSpeaker.name}:`, {
        ...cleanSpeaker,
        presentation: cleanSpeaker.presentation // Log presentation URL specifically
      });
      
      return cleanSpeaker;
    });
    
    console.log(`Successfully processed ${speakers.length} speakers from external API`);
    
    // Save to storage for offline use
    await saveToLocalStorage(SPEAKERS_STORAGE_KEY, speakers);
    await saveToLocalStorage(SPEAKERS_LAST_UPDATED_KEY, new Date().toISOString());
    await saveToLocalStorage(SPEAKERS_SOURCE_KEY, 'external_api');
    
    return {
      speakers,
      success: true,
      message: `Loaded ${speakers.length} speakers from external API`,
      source: 'external_api'
    };
  } catch (error) {
    console.error('Error loading speakers from external API:', error);
    
    // Return error information
    return {
      speakers: [],
      success: false,
      message: `Error loading from external API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'error'
    };
  }
};

// Main function to fetch speakers - ONLY from API
export const fetchSpeakers = async (cacheBuster?: number): Promise<Speaker[]> => {
  try {
    console.log('fetchSpeakers: Attempting to load speakers from API only');
    
    // Try to load from external API
    const externalResult = await loadSpeakersFromExternalAPI();
    
    if (externalResult.success && externalResult.speakers.length > 0) {
      console.log('fetchSpeakers: Successfully loaded speakers from external API');
      return externalResult.speakers;
    }
    
    console.log('fetchSpeakers: External API returned no speakers or failed');
    
    // If API fails, return empty array
    return [];
  } catch (error) {
    console.error('Error in fetchSpeakers:', error);
    return [];
  }
};

// Function to force an update of speakers data - ONLY from API
export const forceSpeakersUpdate = async (): Promise<{
  success: boolean;
  message: string;
  speakers?: Speaker[];
  source?: string;
}> => {
  try {
    console.log('Forcing speakers update from API only...');
    
    // Try external API
    const externalResult = await loadSpeakersFromExternalAPI();
    
    if (externalResult.success && externalResult.speakers.length > 0) {
      return {
        success: true,
        message: `Successfully updated: ${externalResult.speakers.length} speakers from external API`,
        speakers: externalResult.speakers,
        source: 'external_api'
      };
    }
    
    return {
      success: false,
      message: 'Could not update speakers data from API',
      speakers: [],
      source: 'none'
    };
  } catch (error) {
    console.error('Error in forceSpeakersUpdate:', error);
    
    return {
      success: false,
      message: 'Error updating data from API',
      speakers: [],
      source: 'none'
    };
  }
};

// Get the last update time and source
export const getSpeakersDataInfo = async (): Promise<{
  lastUpdated: string | null;
  source: string | null;
}> => {
  try {
    const lastUpdated = await getFromLocalStorage<string>(SPEAKERS_LAST_UPDATED_KEY);
    const source = await getFromLocalStorage<string>(SPEAKERS_SOURCE_KEY);
    
    return {
      lastUpdated,
      source
    };
  } catch (error) {
    console.error('Error getting speakers data info:', error);
    return {
      lastUpdated: null,
      source: null
    };
  }
};