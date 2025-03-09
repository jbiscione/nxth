// This file serves as the entry point for API services
import axios from 'axios';

// Create a base axios instance for external API calls
export const apiClient = axios.create({
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Log the error for debugging
    console.error('API Error:', error);
    
    // Check if error is a network error
    if (error.message === 'Network Error') {
      console.log('Network error detected, switching to offline mode');
    }
    
    // Propagate the error for handling in the service
    return Promise.reject(error);
  }
);

// Export all functions from specific services
export * from './eventService';
export * from './speakerService';
export * from './userService';