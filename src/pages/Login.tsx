import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchEvents } from '../services/eventService';
import { fetchSpeakers } from '../services/speakerService';
import { fetchParticipants, getParticipantsDataInfo, forceParticipantsUpdate, checkParticipantsEndpoint, clearParticipantsCache } from '../services/userService';
import { RefreshCw, Wifi, WifiOff, Database, AlertTriangle, Key } from 'lucide-react';
import DataStatusIndicator from '../components/DataStatusIndicator';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);
  const [participants, setParticipants] = useState<{email: string, name: string}[]>([]);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const navigate = useNavigate();
  const { login, isOfflineMode, setOfflineMode } = useAuth();

  // Add debug log function
  const addDebugLog = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`DEBUG: ${message}`);
  };

  // Load participants on component mount for the dropdown
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setInitialLoading(true);
        addDebugLog('Loading participants data from CSV file...');
        
        // Clear participants cache to ensure fresh data
        await clearParticipantsCache();
        addDebugLog('Participants cache cleared');
        
        // Check CSV file status
        const endpointCheck = await checkParticipantsEndpoint();
        addDebugLog(`CSV file check result: ${endpointCheck.status}`);
        
        if (endpointCheck.error) {
          addDebugLog(`CSV file error: ${endpointCheck.message}`);
          // Continue with other sources even if CSV fails
        }
        
        // Fetch participants data from CSV
        const data = await fetchParticipants();
        
        if (data.length === 0) {
          setError('No participants data available. Please try again later.');
          addDebugLog('No participants data available from CSV');
          setInitialLoading(false);
          return;
        }
        
        addDebugLog(`Loaded ${data.length} participants from CSV`);
        
        // Log each participant for debugging
        data.forEach((p, i) => {
          addDebugLog(`Participant ${i+1}: ${p.firstName} ${p.lastName} (${p.email}) - Password: ${p.password}`);
        });
        
        setParticipants(data.map(p => ({
          email: p.email,
          name: `${p.firstName} ${p.lastName}`
        })));
        
        // Then get data info to update UI
        const dataInfo = await getParticipantsDataInfo();
        setLastUpdated(dataInfo.lastUpdated);
        setDataSource(dataInfo.source);
        
        addDebugLog(`Data source: ${dataInfo.source}, Last updated: ${dataInfo.lastUpdated}`);
      } catch (err) {
        console.error('Login page: Error loading participants:', err);
        addDebugLog(`Error loading participants: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setError('Error loading participants data. Please try again later.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadParticipants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      addDebugLog(`Attempting login with: ${email} / ${password}`);
      const success = await login(email, password);
      if (success) {
        // Show data update message
        setRefreshingData(true);
        addDebugLog('Login successful, updating data...');
        
        // Force data update with current timestamp
        const timestamp = Date.now();
        
        try {
          // Update events and speakers in parallel
          await Promise.all([
            fetchEvents(timestamp),
            fetchSpeakers(timestamp)
          ]);
          
          addDebugLog('Data successfully updated after login');
        } catch (refreshError) {
          console.error('Login page: Error updating data after login:', refreshError);
          addDebugLog(`Error updating data after login: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
          // Don't show error to user, continue with navigation
        }
        
        // Navigate to home page
        navigate('/home');
      } else {
        console.error('Login page: Login failed: Invalid credentials');
        addDebugLog('Login failed: Invalid credentials');
        setError('Credenciales inválidas. Por favor, intenta de nuevo.');
      }
    } catch (err) {
      console.error('Login page: Login error:', err);
      addDebugLog(`Login error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setError('Ocurrió un error durante el inicio de sesión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshingData(false);
    }
  };

  // Handle selecting a user from the dropdown
  const handleUserSelect = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword('12345'); // Default password for demo
    addDebugLog(`Quick login selected: ${selectedEmail} with password: 12345`);
  };
  
  const handleRefresh = async () => {
    if (refreshing) return; // Avoid multiple clicks
    
    setRefreshing(true);
    setError('');
    
    try {
      // If offline mode is enabled, show error
      if (isOfflineMode) {
        setError('No se pueden actualizar los datos en modo sin conexión');
        addDebugLog('Cannot update data in offline mode');
        setTimeout(() => setError(''), 3000);
        setRefreshing(false);
        return;
      }
      
      addDebugLog('Forcing participants data update from CSV file...');
      
      // Clear participants cache first
      await clearParticipantsCache();
      addDebugLog('Participants cache cleared');
      
      // Check CSV file status
      const endpointCheck = await checkParticipantsEndpoint();
      addDebugLog(`CSV file check result: ${endpointCheck.status}`);
      
      if (endpointCheck.error) {
        addDebugLog(`CSV file error: ${endpointCheck.message}`);
        // Continue with other sources even if CSV fails
      }
      
      // Force update participants
      const result = await forceParticipantsUpdate();
      if (result.success && result.participants) {
        setParticipants(result.participants.map(p => ({
          email: p.email,
          name: `${p.firstName} ${p.lastName}`
        })));
        setDataSource(result.source || null);
        setError(`Datos actualizados correctamente. Total: ${result.participants.length} participantes.`);
        
        // Update last updated info
        const updatedInfo = await getParticipantsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        
        addDebugLog(`Participants updated successfully from ${result.source}`);
        
        // Log each participant for debugging
        result.participants.forEach((p, i) => {
          addDebugLog(`Updated participant ${i+1}: ${p.firstName} ${p.lastName} (${p.email}) - Password: ${p.password}`);
        });
      } else {
        setError(result.message || 'Error al actualizar los datos');
        setDataSource(result.source || null);
        addDebugLog(`Failed to update participants: ${result.message}`);
      }
      
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Login page: Error refreshing participants:', error);
      addDebugLog(`Error refreshing participants: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setError('Error al actualizar los datos. Inténtalo de nuevo.');
    } finally {
      setRefreshing(false);
    }
  };
  
  const toggleOfflineMode = () => {
    setOfflineMode(!isOfflineMode);
    addDebugLog(`Offline mode ${!isOfflineMode ? 'enabled' : 'disabled'}`);
  };
  
  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  return (
    <div className="min-h-screen bg-[#7065ef] text-white flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="https://nexthumans.net/wp-content/uploads/2024/04/nxth-2.png" 
              alt="NeXthumans Logo" 
              className="h-16"
            />
          </div>
          <h1 className="text-3xl font-bold">NeXthumans TANDIL 2025</h1>
          <p className="text-white/80 mt-2">Inicia sesión para acceder al evento</p>
        </div>

        {/* Data Status Indicator */}
        {!initialLoading && (
          <div className="mb-4">
            <DataStatusIndicator 
              source={dataSource}
              lastUpdated={lastUpdated}
              isLoading={refreshing}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {/* Mensaje de éxito o error */}
        {error && (
          <div className={`mb-4 px-4 py-2 rounded-lg ${
            error.includes('actualizados correctamente')
              ? 'bg-green-500/20 border border-green-500 text-green-100' 
              : 'bg-red-500/20 border border-red-500 text-red-100'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg">
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50"
              placeholder="••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || refreshingData}
            className="w-full bg-white text-[#7065ef] py-2 px-4 rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <RefreshCw size={18} className="animate-spin mr-2" />
                Iniciando sesión...
              </span>
            ) : refreshingData ? (
              <span className="flex items-center justify-center">
                <RefreshCw size={18} className="animate-spin mr-2" />
                Actualizando datos...
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </button>
          
          {/* Offline mode toggle */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center">
              <button 
                type="button"
                onClick={toggleOfflineMode}
                className="flex items-center text-white/70 hover:text-white"
              >
                {isOfflineMode ? (
                  <>
                    <WifiOff size={16} className="mr-1 text-yellow-300" />
                    <span>Modo sin conexión</span>
                  </>
                ) : (
                  <>
                    <Wifi size={16} className="mr-1 text-green-300" />
                    <span>Modo con conexión</span>
                  </>
                )}
              </button>
            </div>
            
            <button 
              type="button"
              onClick={toggleDebugInfo}
              className="text-white/70 hover:text-white flex items-center"
            >
              <Database size={16} className="mr-1" />
              <span>Info</span>
            </button>
          </div>
        </form>
        
        {/* Quick Login Section */}
        {participants.length > 0 && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Key size={14} className="mr-1" />
              Acceso rápido (solo para pruebas)
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {participants.map((participant, index) => (
                <button
                  key={index}
                  onClick={() => handleUserSelect(participant.email)}
                  className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm flex justify-between items-center"
                >
                  <span className="truncate">{participant.name}</span>
                  <span className="text-xs opacity-70 truncate">{participant.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Debug Info */}
        {showDebugInfo && (
          <div className="mt-6 bg-black/30 backdrop-blur-sm rounded-xl p-4 text-xs">
            <h3 className="font-medium mb-2 flex items-center">
              <Database size={14} className="mr-1" />
              Debug Information
            </h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {debugInfo.map((log, index) => (
                <div key={index} className="text-white/70">{log}</div>
              ))}
              {debugInfo.length === 0 && (
                <div className="text-white/50">No debug logs available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;