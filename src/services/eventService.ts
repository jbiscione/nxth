import { Event, PopularEvent } from '../types';
import { getFromLocalStorage, saveToLocalStorage } from './localStorageService';
import Papa from 'papaparse';
import axios from 'axios';

// Storage keys
const EVENTS_STORAGE_KEY = 'events_data';
const EVENTS_LAST_UPDATED_KEY = 'events_last_updated';
const EVENTS_SOURCE_KEY = 'events_data_source';

// External API URL (if available in the future) - using proxy to avoid CORS issues
const EXTERNAL_EVENTS_API = '/api/external/Events.json';

// Function to load events from external API
export const loadEventsFromExternalAPI = async (): Promise<{
  events: Event[];
  success: boolean;
  message: string;
  source: string;
}> => {
  try {
    console.log('Attempting to fetch events from external API via proxy...');
    console.log('Sending request to:', EXTERNAL_EVENTS_API);
    
    // Fetch data from external API through the proxy
    const response = await axios.get(EXTERNAL_EVENTS_API, {
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
    
    console.log('Received response from:', EXTERNAL_EVENTS_API + '?_t=' + new Date().getTime(), 'Status:', response.status);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid data format from external API:', response.data);
      throw new Error('Invalid data format from external API');
    }
    
    // Map API data to Event objects - ensure all values are serializable
    const events = response.data.map((item: any, index: number) => {
      // Create a clean object with only the properties we need
      // This prevents any non-serializable values from being included
      const cleanEvent: Event = {
        id: typeof item.id === 'number' ? item.id : index + 1,
        day: typeof item.day === 'string' ? item.day : '',
        date: typeof item.date === 'string' ? item.date : '',
        startTime: typeof item.startTime === 'string' ? item.startTime : '',
        endTime: typeof item.endTime === 'string' ? item.endTime : '',
        activity: typeof item.activity === 'string' ? item.activity : '',
        facilitator: typeof item.facilitator === 'string' ? item.facilitator : 'NA',
        location: typeof item.location === 'string' ? item.location : 'NA',
        requirements: typeof item.requirements === 'string' ? item.requirements : '',
        comments: typeof item.comments === 'string' ? item.comments : '',
        photo: typeof item.photo === 'string' ? item.photo : '',
        popular: typeof item.popular === 'string' ? item.popular : 'NO',
        video: typeof item.video === 'string' ? item.video : '' // Add video URL mapping
      };

      // Log the event data for debugging
      console.log(`Processing event ${cleanEvent.activity}:`, {
        ...cleanEvent,
        video: cleanEvent.video // Log video URL specifically
      });
      
      return cleanEvent;
    });
    
    console.log(`Successfully processed ${events.length} events from external API`);
    
    // Save to storage for offline use
    await saveToLocalStorage(EVENTS_STORAGE_KEY, events);
    await saveToLocalStorage(EVENTS_LAST_UPDATED_KEY, new Date().toISOString());
    await saveToLocalStorage(EVENTS_SOURCE_KEY, 'external_api');
    
    return {
      events,
      success: true,
      message: `Loaded ${events.length} events from external API`,
      source: 'external_api'
    };
  } catch (error) {
    console.error('Error loading events from external API:', error);
    
    // Return error information
    return {
      events: [],
      success: false,
      message: `Error loading from external API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      source: 'error'
    };
  }
};

// Main function to fetch events - ONLY from API
export const fetchEvents = async (cacheBuster?: number): Promise<Event[]> => {
  try {
    console.log('fetchEvents: Attempting to load events from API only');
    
    // Try to load from external API
    const externalResult = await loadEventsFromExternalAPI();
    
    if (externalResult.success && externalResult.events.length > 0) {
      console.log('fetchEvents: Successfully loaded events from external API');
      return externalResult.events;
    }
    
    console.log('fetchEvents: External API returned no events or failed');
    
    // If API fails, return empty array
    return [];
  } catch (error) {
    console.error('Error in fetchEvents:', error);
    return [];
  }
};

// Function to force an update of events data - ONLY from API
export const forceEventsUpdate = async (): Promise<{
  success: boolean;
  message: string;
  events?: Event[];
  source?: string;
}> => {
  try {
    console.log('Forcing events update from API only...');
    
    // Try external API
    const externalResult = await loadEventsFromExternalAPI();
    
    if (externalResult.success && externalResult.events.length > 0) {
      return {
        success: true,
        message: `Successfully updated: ${externalResult.events.length} events from external API`,
        events: externalResult.events,
        source: 'external_api'
      };
    }
    
    return {
      success: false,
      message: 'Could not update events data from API',
      events: [],
      source: 'none'
    };
  } catch (error) {
    console.error('Error in forceEventsUpdate:', error);
    
    return {
      success: false,
      message: 'Error updating data from API',
      events: [],
      source: 'none'
    };
  }
};

// Function to convert events to format of UserEvent
export const convertToUserEvents = (events: Event[]): any[] => {
  return events.map(event => ({
    id: event.id,
    title: event.activity,
    timeRange: `${event.startTime} - ${event.endTime}`,
    timeLeft: event.day,
    day: event.day
  }));
};

// Function to check if an image URL is valid
const isValidImageUrl = (url?: string): boolean => {
  if (!url) return false;
  return url.startsWith('https://') || url.startsWith('http://');
};

// Function to get popular events
export const fetchPopularEvents = async (cacheBuster?: number): Promise<PopularEvent[]> => {
  try {
    // Get all events
    const allEvents = await fetchEvents(cacheBuster);
    
    // Filter only events marked as popular
    const popularEvents = allEvents.filter(event => event.popular === 'SI');
    
    // Convert to PopularEvent format
    return popularEvents.map(event => ({
      id: event.id,
      title: event.activity,
      date: formatDate(event.date),
      time: `${event.startTime} - ${event.endTime}`,
      imageUrl: isValidImageUrl(event.photo) 
        ? event.photo! 
        : 'https://nexthumans.net/wp-content/uploads/2024/04/nxth-2.png',
    }));
  } catch (error) {
    console.error('Error in fetchPopularEvents:', error);
    return [];
  }
};

// Get the last update time and source
export const getEventsDataInfo = async (): Promise<{
  lastUpdated: string | null;
  source: string | null;
}> => {
  try {
    const lastUpdated = await getFromLocalStorage<string>(EVENTS_LAST_UPDATED_KEY);
    const source = await getFromLocalStorage<string>(EVENTS_SOURCE_KEY);
    
    return {
      lastUpdated,
      source
    };
  } catch (error) {
    console.error('Error getting events data info:', error);
    return {
      lastUpdated: null,
      source: null
    };
  }
};

// Helper function to format date
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const [day, month] = dateStr.split('/');
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthIndex = parseInt(month, 10) - 1;
    
    return `${monthNames[monthIndex]} ${day}`;
  } catch (error) {
    return dateStr;
  }
};