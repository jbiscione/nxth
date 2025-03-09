import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { validateUser, getParticipantByEmail } from '../services/userService';
import { Participant } from '../types';
import { getFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from '../services/localStorageService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: Participant | null;
  isOfflineMode: boolean;
  lastUpdated: string | null;
  clearCache: () => Promise<void>;
  refreshData: () => Promise<void>;
  setOfflineMode: (mode: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<Participant | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Verificar si hay una sesión guardada al cargar la aplicación
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        console.log('AuthContext: Loading stored authentication data...');
        
        // Check if offline mode is stored
        const storedOfflineMode = await getFromLocalStorage<boolean>(STORAGE_KEYS.OFFLINE_MODE);
        
        // Verificar si estamos en modo offline
        const isCurrentlyOffline = !navigator.onLine;
        setIsOfflineMode(storedOfflineMode !== null ? storedOfflineMode : isCurrentlyOffline);
        
        console.log(`AuthContext: Offline mode set to ${storedOfflineMode !== null ? storedOfflineMode : isCurrentlyOffline}`);
        
        // Obtener el usuario del almacenamiento local
        const storedUser = await getFromLocalStorage<Participant>(STORAGE_KEYS.USER);
        
        if (storedUser && storedUser.email) {
          console.log(`AuthContext: Found stored user: ${storedUser.firstName} ${storedUser.lastName}`);
          
          // Verificar que el usuario existe en nuestro sistema
          try {
            const participant = await getParticipantByEmail(storedUser.email);
            
            if (participant) {
              console.log(`AuthContext: Verified user exists: ${participant.firstName} ${participant.lastName}`);
              setUser(participant);
              setIsAuthenticated(true);
            } else {
              console.log('AuthContext: Stored user not found in current participants data');
            }
          } catch (error) {
            console.error('AuthContext: Error verificando usuario:', error);
          }
        } else {
          console.log('AuthContext: No stored user found');
        }
      } catch (error) {
        console.error('AuthContext: Error loading stored auth data:', error);
      }
    };

    loadStoredAuth();
    
    // Agregar event listeners para detectar cambios en la conexión
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);
  
  // Manejar cambios en la conexión
  const handleConnectionChange = () => {
    const newOfflineState = !navigator.onLine;
    console.log(`AuthContext: Connection changed: ${newOfflineState ? 'offline' : 'online'}`);
    
    // Only update if not manually set
    const manuallySet = getFromLocalStorage<boolean>(STORAGE_KEYS.OFFLINE_MODE);
    if (manuallySet === null) {
      setIsOfflineMode(newOfflineState);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log(`AuthContext: Login attempt for ${email}`);
      
      // Validar contra nuestro servicio
      const validatedUser = await validateUser(email, password);
      
      if (validatedUser) {
        console.log(`AuthContext: Login successful for ${validatedUser.firstName} ${validatedUser.lastName}`);
        setUser(validatedUser);
        setIsAuthenticated(true);
        
        // Guardar en localStorage para persistencia de sesión
        await saveToLocalStorage(STORAGE_KEYS.USER, validatedUser);
        
        return true;
      }
      
      console.log(`AuthContext: Login failed for ${email}`);
      return false;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    setIsAuthenticated(false);
    setUser(null);
    // Eliminar datos de sesión
    sessionStorage.clear();
  };
  
  const clearCache = async () => {
    try {
      console.log('AuthContext: Clearing cache and reloading page');
      // Recargar la página con un parámetro para forzar actualización
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('t', Date.now().toString());
      window.location.href = newUrl.toString();
      return Promise.resolve();
    } catch (error) {
      console.error('AuthContext: Error clearing cache:', error);
      return Promise.reject(error);
    }
  };
  
  // Función para refrescar datos
  const refreshData = async () => {
    try {
      console.log('AuthContext: Refreshing data and reloading page');
      // Recargar la página con un parámetro para forzar actualización
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('refresh', Date.now().toString());
      window.location.href = newUrl.toString();
      return Promise.resolve();
    } catch (error) {
      console.error('AuthContext: Error refreshing data:', error);
      return Promise.reject(error);
    }
  };
  
  // Función para establecer manualmente el modo offline
  const setOfflineMode = (mode: boolean) => {
    console.log(`AuthContext: Manually setting offline mode to ${mode}`);
    setIsOfflineMode(mode);
    saveToLocalStorage(STORAGE_KEYS.OFFLINE_MODE, mode);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      user, 
      isOfflineMode, 
      lastUpdated,
      clearCache,
      refreshData,
      setOfflineMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};