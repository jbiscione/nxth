import { Participant } from '../types';
import { saveToLocalStorage, getFromLocalStorage, STORAGE_KEYS } from './localStorageService';
import axios from 'axios';

// Storage keys
const PARTICIPANTS_STORAGE_KEY = 'user_data';
const PARTICIPANTS_LAST_UPDATED_KEY = 'user_last_updated';
const PARTICIPANTS_SOURCE_KEY = 'user_data_source';

// External API URL - using proxy to avoid CORS issues
const EXTERNAL_PARTICIPANTS_API = '/api/external/Participants.json';

// Function to safely stringify objects for logging
const safeStringify = (obj: any): string => {
  try {
    // Replace circular references and non-serializable values
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      // Handle non-serializable values
      if (typeof value === 'symbol' || typeof value === 'function') {
        return value.toString();
      }
      return value;
    });
  } catch (error) {
    return `[Object cannot be stringified: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
};

// Function to load participants from external API
export const loadParticipantsFromAPI = async (): Promise<{
  participants: Participant[];
  success: boolean;
  message: string;
  source: string;
}> => {
  try {
    console.log('Attempting to fetch participants from external API...');
    
    const response = await axios.get(EXTERNAL_PARTICIPANTS_API, {
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
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid data format from API');
    }
    
    const participants = response.data.map((item: any, index) => ({
      id: index + 1,
      firstName: item.Nombre || '',
      lastName: item.Apellido || '',
      email: item.Usuario || '',
      password: String(item.Contraseña || '12345'),
      photoUrl: item.Foto || '',
      role: item.Role || '',
      linkedinUrl: item.Linkedin || '',
      instagramUrl: item.Instagram || ''
    }));
    
    console.log(`Successfully processed ${participants.length} participants from API`);
    
    // Save to storage for offline use
    await saveToLocalStorage(PARTICIPANTS_STORAGE_KEY, participants);
    await saveToLocalStorage(PARTICIPANTS_LAST_UPDATED_KEY, new Date().toISOString());
    await saveToLocalStorage(PARTICIPANTS_SOURCE_KEY, 'external_api');
    
    return {
      participants,
      success: true,
      message: `Loaded ${participants.length} participants from API`,
      source: 'external_api'
    };
  } catch (error) {
    console.error('Error loading participants from API:', error);
    return {
      participants: [],
      success: false,
      message: `Error loading from API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'error'
    };
  }
};

// Function to provide hardcoded participants as fallback
export const getHardcodedParticipants = (): Participant[] => {
  const hardcodedParticipants: Participant[] = [
    {
      id: 1,
      firstName: 'Juan',
      lastName: 'Biscione',
      email: 'jbiscione@gmail.com',
      password: '12345',
      photoUrl: 'https://nexthumans.net/wp-content/uploads/2024/04/biscione.png',
      linkedinUrl: '',
      instagramUrl: ''
    },
    {
      id: 2,
      firstName: 'Agustina',
      lastName: 'Paz',
      email: 'apaz@gmail.com',
      password: '12345',
      photoUrl: 'https://nexthumans.net/wp-content/uploads/2024/04/Foto_367x382px.png',
      linkedinUrl: '',
      instagramUrl: ''
    }
  ];
  
  return hardcodedParticipants;
};

// Main function to fetch participants
export const fetchParticipants = async (cacheBuster?: number): Promise<Participant[]> => {
  try {
    console.log('fetchParticipants: Attempting to load participants from API');
    
    // Try to load from external API first
    const apiResult = await loadParticipantsFromAPI();
    
    if (apiResult.success && apiResult.participants.length > 0) {
      console.log('fetchParticipants: Successfully loaded participants from API');
      return apiResult.participants;
    }
    
    console.log('fetchParticipants: API failed, trying localStorage...');
    
    // If API fails, try to get from storage
    const storedParticipants = await getFromLocalStorage<Participant[]>(PARTICIPANTS_STORAGE_KEY);
    if (storedParticipants && storedParticipants.length > 0) {
      console.log('fetchParticipants: Using cached participants data from localStorage');
      await saveToLocalStorage(PARTICIPANTS_SOURCE_KEY, 'cache');
      return storedParticipants;
    }
    
    // If all fails, use hardcoded participants
    console.log('fetchParticipants: All sources failed, using hardcoded participants');
    const hardcodedParticipants = getHardcodedParticipants();
    await saveToLocalStorage(PARTICIPANTS_STORAGE_KEY, hardcodedParticipants);
    await saveToLocalStorage(PARTICIPANTS_LAST_UPDATED_KEY, new Date().toISOString());
    await saveToLocalStorage(PARTICIPANTS_SOURCE_KEY, 'hardcoded');
    
    return hardcodedParticipants;
  } catch (error) {
    console.error('Error in fetchParticipants:', error);
    
    // Try to get from storage as fallback
    const storedParticipants = await getFromLocalStorage<Participant[]>(PARTICIPANTS_STORAGE_KEY);
    if (storedParticipants && storedParticipants.length > 0) {
      console.log('Error occurred, using cached participants data');
      await saveToLocalStorage(PARTICIPANTS_SOURCE_KEY, 'cache');
      return storedParticipants;
    }
    
    // If all else fails, return hardcoded participants
    const hardcodedParticipants = getHardcodedParticipants();
    await saveToLocalStorage(PARTICIPANTS_STORAGE_KEY, hardcodedParticipants);
    await saveToLocalStorage(PARTICIPANTS_LAST_UPDATED_KEY, new Date().toISOString());
    await saveToLocalStorage(PARTICIPANTS_SOURCE_KEY, 'hardcoded');
    
    return hardcodedParticipants;
  }
};

// Function to force an update of participants data
export const forceParticipantsUpdate = async (): Promise<{
  success: boolean;
  message: string;
  participants?: Participant[];
  source?: string;
}> => {
  try {
    console.log('Forcing participants update from API...');
    
    // Clear cache first
    await clearParticipantsCache();
    
    // Try API
    const apiResult = await loadParticipantsFromAPI();
    
    if (apiResult.success && apiResult.participants.length > 0) {
      return {
        success: true,
        message: `Successfully updated: ${apiResult.participants.length} participants from API`,
        participants: apiResult.participants,
        source: 'external_api'
      };
    }
    
    // If API fails, try to get from storage
    console.log('API update failed, trying localStorage...');
    const storedParticipants = await getFromLocalStorage<Participant[]>(PARTICIPANTS_STORAGE_KEY);
    if (storedParticipants && storedParticipants.length > 0) {
      return {
        success: false,
        message: 'Could not update from API. Using stored data.',
        participants: storedParticipants,
        source: 'cache'
      };
    }
    
    // If all fails, use hardcoded participants
    console.log('All sources failed, using hardcoded participants...');
    const hardcodedParticipants = getHardcodedParticipants();
    await saveToLocalStorage(PARTICIPANTS_STORAGE_KEY, hardcodedParticipants);
    await saveToLocalStorage(PARTICIPANTS_LAST_UPDATED_KEY, new Date().toISOString());
    await saveToLocalStorage(PARTICIPANTS_SOURCE_KEY, 'hardcoded');
    
    return {
      success: true,
      message: 'Using hardcoded participants data',
      participants: hardcodedParticipants,
      source: 'hardcoded'
    };
  } catch (error) {
    console.error('Error in forceParticipantsUpdate:', error);
    
    // Try to get from storage as fallback
    const storedParticipants = await getFromLocalStorage<Participant[]>(PARTICIPANTS_STORAGE_KEY);
    if (storedParticipants && storedParticipants.length > 0) {
      return {
        success: false,
        message: 'Error updating data. Using stored data.',
        participants: storedParticipants,
        source: 'cache'
      };
    }
    
    // If all else fails, return hardcoded participants
    const hardcodedParticipants = getHardcodedParticipants();
    await saveToLocalStorage(PARTICIPANTS_STORAGE_KEY, hardcodedParticipants);
    await saveToLocalStorage(PARTICIPANTS_LAST_UPDATED_KEY, new Date().toISOString());
    await saveToLocalStorage(PARTICIPANTS_SOURCE_KEY, 'hardcoded');
    
    return {
      success: true,
      message: 'Using hardcoded participants data after error',
      participants: hardcodedParticipants,
      source: 'hardcoded'
    };
  }
};

// Get the last update time and source
export const getParticipantsDataInfo = async (): Promise<{
  lastUpdated: string | null;
  source: string | null;
}> => {
  try {
    const lastUpdated = await getFromLocalStorage<string>(PARTICIPANTS_LAST_UPDATED_KEY);
    const source = await getFromLocalStorage<string>(PARTICIPANTS_SOURCE_KEY);
    
    return {
      lastUpdated,
      source
    };
  } catch (error) {
    console.error('Error getting participants data info:', error);
    return {
      lastUpdated: null,
      source: null
    };
  }
};

// Function to validate user credentials
export const validateUser = async (email: string, password: string): Promise<Participant | null> => {
  try {
    console.log(`Attempting to validate user: ${email}`);
    
    // Load participants from API
    const participants = await fetchParticipants();
    
    // Debug log to check available participants
    console.log(`Found ${participants.length} participants to validate against`);
    
    // Find user by email and password - case insensitive email comparison
    const user = participants.find(p => {
      const emailMatch = p.email.toLowerCase() === email.toLowerCase();
      const passwordMatch = p.password === password;
      return emailMatch && passwordMatch;
    });
    
    // If user is found, save to local storage
    if (user) {
      console.log(`User validated successfully: ${user.firstName} ${user.lastName}`);
      await saveToLocalStorage(STORAGE_KEYS.USER, user);
      return user;
    }
    
    console.log('Authentication failed: No matching user found');
    return null;
  } catch (error) {
    console.error('Error validating user:', error);
    return null;
  }
};

// Function to get a participant by email
export const getParticipantByEmail = async (email: string): Promise<Participant | null> => {
  try {
    console.log(`Getting participant by email: ${email}`);
    
    // First try to get user from local storage
    const sessionUser = await getFromLocalStorage<Participant>(STORAGE_KEYS.USER);
    if (sessionUser && sessionUser.email.toLowerCase() === email.toLowerCase()) {
      console.log(`Found user in session storage: ${sessionUser.firstName} ${sessionUser.lastName}`);
      return sessionUser;
    }
    
    // If not in session, look in API data
    const participants = await fetchParticipants();
    const participant = participants.find(p => p.email.toLowerCase() === email.toLowerCase());
    
    if (participant) {
      console.log(`Found participant in data: ${participant.firstName} ${participant.lastName}`);
      return participant;
    }
    
    console.log(`No participant found with email: ${email}`);
    return null;
  } catch (error) {
    console.error('Error getting participant by email:', error);
    return null;
  }
};

// Function to check the API endpoint
export const checkParticipantsEndpoint = async (): Promise<any> => {
  try {
    console.log('Checking API endpoint status...');
    
    const response = await axios.get(EXTERNAL_PARTICIPANTS_API, {
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
    
    return {
      status: response.status,
      data: response.data,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error checking API endpoint:', error);
    
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
};

// Function to clear all participant data and force reload from API
export const clearParticipantsCache = async (): Promise<boolean> => {
  try {
    console.log('Clearing participants cache...');
    
    // Remove all participant-related data from storage
    localStorage.removeItem(PARTICIPANTS_STORAGE_KEY);
    localStorage.removeItem(PARTICIPANTS_LAST_UPDATED_KEY);
    localStorage.removeItem(PARTICIPANTS_SOURCE_KEY);
    
    // Also clear from session storage
    sessionStorage.removeItem(PARTICIPANTS_STORAGE_KEY);
    sessionStorage.removeItem(PARTICIPANTS_LAST_UPDATED_KEY);
    sessionStorage.removeItem(PARTICIPANTS_SOURCE_KEY);
    
    console.log('Participants cache cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing participants cache:', error);
    return false;
  }
};