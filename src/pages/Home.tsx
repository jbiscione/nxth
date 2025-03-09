import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, PenTool as Tool, User, Bell, HelpCircle, RefreshCw, Wifi, WifiOff, Database } from 'lucide-react';
import EventCard from '../components/EventCard';
import PopularEventCard from '../components/PopularEventCard';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchEvents, convertToUserEvents, fetchPopularEvents, getEventsDataInfo, forceEventsUpdate } from '../services/eventService';
import OfflineIndicator from '../components/OfflineIndicator';
import { getLastUpdated, clearLocalStorage, forceFullCacheReset } from '../services/localStorageService';
import DataStatusIndicator from '../components/DataStatusIndicator';
import { loadConfigFromAPI, getConfig } from '../services/configService';

const Home: React.FC = () => {
  const [userEvents, setUserEvents] = useState([]);
  const [popularEvents, setPopularEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOfflineTooltip, setShowOfflineTooltip] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('1');
  const { user, isOfflineMode, clearCache, setOfflineMode } = useAuth();

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Load config first and force refresh
      const configResult = await loadConfigFromAPI();
      if (configResult.success && configResult.config) {
        setCurrentDay(configResult.config.day);
      }
      
      // Get data info first
      const dataInfo = await getEventsDataInfo();
      setLastUpdated(dataInfo.lastUpdated);
      setDataSource(dataInfo.source);
      
      // Si se solicita actualización forzada, limpiar la caché primero
      if (forceRefresh) {
        // If offline mode is enabled and force refresh is requested, show error
        if (isOfflineMode) {
          setError('No se pueden actualizar los datos en modo sin conexión');
          setTimeout(() => setError(''), 3000);
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        // Force update events
        const result = await forceEventsUpdate();
        if (result.success && result.events) {
          // Filter events for current day
          const filteredEvents = result.events.filter(event => event.day === `Día ${configResult.config?.day || '1'}`);
          const userEventsData = convertToUserEvents(filteredEvents);
          setUserEvents(userEventsData);
          setDataSource(result.source || null);
          
          // Get popular events
          const popularEventsData = await fetchPopularEvents();
          setPopularEvents(popularEventsData);
          
          setError(`Datos actualizados correctamente. Total: ${result.events.length} eventos.`);
          setTimeout(() => setError(''), 3000);
        } else {
          setError(result.message || 'Error al actualizar los datos');
          setDataSource(result.source || null);
        }
        
        // Update last updated info
        const updatedInfo = await getEventsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
      } else {
        // Obtenemos los eventos normalmente
        const events = await fetchEvents();
        // Filter events for current day
        const filteredEvents = events.filter(event => event.day === `Día ${configResult.config?.day || '1'}`);
        const userEventsData = convertToUserEvents(filteredEvents);
        const popularEventsData = await fetchPopularEvents();
        
        setUserEvents(userEventsData);
        setPopularEvents(popularEventsData);
        
        // Get updated data info
        const updatedInfo = await getEventsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        setDataSource(updatedInfo.source);
      }
    } catch (err) {
      console.error('Error fetching data:', err instanceof Error ? err.message : 'Unknown error');
      setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Elementos de la barra de navegación
  const navItems = [
    { icon: <Calendar size={24} />, label: 'Inicio', active: true },
    { icon: <Users size={24} />, label: 'Speakers', active: false },
    { icon: <User size={24} />, label: 'Participantes', active: false },
    { icon: <Tool size={24} />, label: 'Herramientas', active: false },
  ];

  const toggleHelpTooltip = () => {
    setShowHelpTooltip(!showHelpTooltip);
    setShowOfflineTooltip(false);
  };

  const toggleOfflineTooltip = () => {
    setShowOfflineTooltip(!showOfflineTooltip);
    setShowHelpTooltip(false);
  };

  const handleRefresh = async () => {
    if (refreshing) return; // Evitar múltiples clics
    
    setRefreshing(true);
    setShowHelpTooltip(false);
    setShowOfflineTooltip(false);
    
    // Si estamos en modo offline, mostrar un mensaje
    if (isOfflineMode) {
      setTimeout(() => {
        setRefreshing(false);
        setError('No se pueden actualizar los datos en modo sin conexión');
        // Limpiar el mensaje después de 3 segundos
        setTimeout(() => setError(''), 3000);
      }, 1000);
      return;
    }
    
    try {
      // Forzar actualización de datos con limpieza de caché
      await fetchData(true);
      console.log('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error durante la actualización:', error);
      setRefreshing(false);
      setError('Error al actualizar los datos. Inténtalo de nuevo.');
    }
  };

  const handleForceReset = async () => {
    if (refreshing) return; // Evitar múltiples clics
    
    if (confirm('¿Estás seguro de que quieres forzar un reinicio completo de la aplicación? Esto limpiará toda la caché y recargará la página.')) {
      setRefreshing(true);
      try {
        await forceFullCacheReset();
      } catch (error) {
        console.error('Error durante el reinicio:', error);
        setRefreshing(false);
        setError('Error al reiniciar la aplicación. Inténtalo de nuevo.');
      }
    }
  };
  
  const toggleOfflineMode = () => {
    setOfflineMode(!isOfflineMode);
    setShowOfflineTooltip(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 pt-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              <img 
                src={user?.photoUrl || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
                }}
              />
            </div>
            <span className="text-gray-300">Hola, {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}</span>
          </div>
          <div className="flex gap-2">
            {/* Offline status button */}
            <div className="relative">
              <button 
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
                onClick={toggleOfflineTooltip}
              >
                {isOfflineMode ? (
                  <WifiOff size={20} className="text-yellow-400" />
                ) : (
                  <Wifi size={20} className="text-green-400" />
                )}
              </button>
              
              {showOfflineTooltip && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-3 z-10">
                  <h4 className="font-semibold mb-2">
                    {isOfflineMode ? 'Modo sin conexión' : 'Conectado'}
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    {isOfflineMode 
                      ? 'Estás usando datos almacenados localmente. Conéctate a internet para actualizar.' 
                      : 'Tienes conexión a internet. Los datos se actualizan automáticamente.'}
                  </p>
                  <div className="flex justify-between">
                    <button 
                      className="text-sm text-[#7065ef] hover:underline flex items-center"
                      onClick={handleRefresh}
                      disabled={refreshing || isOfflineMode}
                    >
                      <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                      Actualizar datos
                    </button>
                    
                    <button 
                      className="text-sm text-gray-300 hover:underline flex items-center"
                      onClick={toggleOfflineMode}
                    >
                      {isOfflineMode ? (
                        <>
                          <Wifi size={14} className="mr-1" />
                          Modo online
                        </>
                      ) : (
                        <>
                          <WifiOff size={14} className="mr-1" />
                          Modo offline
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Refresh button */}
            <button 
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
              onClick={handleRefresh}
              disabled={refreshing || isOfflineMode}
            >
              <RefreshCw size={20} className={`${refreshing ? 'animate-spin text-[#7065ef]' : 'text-gray-300'}`} />
            </button>
            
            {/* Help button */}
            <div className="relative">
              <button 
                className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
                onClick={toggleHelpTooltip}
              >
                <HelpCircle size={20} className="text-gray-300" />
              </button>
              
              {showHelpTooltip && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg p-3 z-10">
                  <h4 className="font-semibold mb-2">¿Necesitas ayuda?</h4>
                  <p className="text-sm text-gray-300 mb-2">Si tienes problemas con nuestra app o necesitas asistencia:</p>
                  <div className="flex justify-between">
                    <a 
                      href="https://api.whatsapp.com/send/?phone=5491130252959&text=Necesito+ayuda+con+la+app+de+NeXthumans" 
                      className="text-sm text-[#7065ef] hover:underline flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Contactar soporte
                    </a>
                    
                    <button 
                      className="text-sm text-gray-300 hover:underline flex items-center"
                      onClick={handleForceReset}
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Reiniciar app
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Status Indicator */}
        <div className="px-4 mb-3">
          <DataStatusIndicator 
            source={dataSource}
            lastUpdated={lastUpdated}
            isLoading={refreshing}
            onRefresh={handleRefresh}
            hideSuccessIndicator={true}
          />
        </div>

        {/* Mensaje de éxito o error */}
        {error && (
          <div className={`mx-4 mb-4 px-4 py-2 rounded-lg ${
            error.includes('actualizados correctamente')
              ? 'bg-green-500/20 border border-green-500 text-green-100' 
              : 'bg-red-500/20 border border-red-500 text-red-100'
          }`}>
            {error}
          </div>
        )}

        {/* Your Events Section */}
        <div className="px-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">Calendario de Eventos</h2>
            <Link to="/all-events" className="text-sm text-gray-400 hover:text-[#7065ef]">Ver todos</Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {userEvents.length > 0 ? (
                userEvents.slice(0, 3).map(event => (
                  <EventCard 
                    key={event.id}
                    id={event.id}
                    title={event.title} 
                    timeRange={event.timeRange} 
                    timeLeft={event.timeLeft}
                    day={event.day}
                  />
                ))
              ) : (
                <p className="text-gray-400 py-4 text-center">No hay eventos disponibles</p>
              )}
            </div>
          )}
        </div>

        {/* Popular Events Section */}
        <div className="px-4 mt-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">Eventos Destacados</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {popularEvents.length > 0 ? (
                popularEvents.map(event => (
                  <PopularEventCard 
                    key={event.id} 
                    id={event.id}
                    title={event.title} 
                    date={event.date} 
                    time={event.time} 
                    imageUrl={event.imageUrl} 
                  />
                ))
              ) : (
                <p className="text-gray-400 py-4 text-center col-span-2">No hay eventos populares disponibles</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Bottom Navigation */}
      <Navbar items={navItems} />
    </div>
  );
};

export default Home;