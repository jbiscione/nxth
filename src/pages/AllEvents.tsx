import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Calendar, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { fetchEvents, convertToUserEvents, forceEventsUpdate, getEventsDataInfo } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import DataStatusIndicator from '../components/DataStatusIndicator';
import { loadConfigFromAPI, getConfig } from '../services/configService';

const AllEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState<string>('1');
  const { isOfflineMode, setOfflineMode } = useAuth();

  const fetchEventsData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Load config first
      const configResult = await loadConfigFromAPI();
      if (configResult.success && configResult.config) {
        setCurrentDay(configResult.config.day);
        // Set the filter to the current day from config
        setFilterDay(`Día ${configResult.config.day}`);
      }
      
      // Get data info first
      const dataInfo = await getEventsDataInfo();
      setLastUpdated(dataInfo.lastUpdated);
      setDataSource(dataInfo.source);
      
      // If offline mode is enabled and force refresh is requested, show error
      if (isOfflineMode && forceRefresh) {
        setError('No se pueden actualizar los datos en modo sin conexión');
        setTimeout(() => setError(''), 3000);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // If force refresh is requested, use the force update service
      if (forceRefresh) {
        const result = await forceEventsUpdate();
        if (result.success && result.events) {
          const formattedEvents = convertToUserEvents(result.events);
          setEvents(formattedEvents);
          setDataSource(result.source || null);
          setError(`Datos actualizados correctamente. Total: ${formattedEvents.length} eventos.`);
          setTimeout(() => setError(''), 3000);
        } else {
          setError(result.message || 'Error al actualizar los datos');
          setDataSource(result.source || null);
        }
        
        // Update last updated info
        const updatedInfo = await getEventsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
      } else {
        // Get events normally
        const eventsData = await fetchEvents();
        const formattedEvents = convertToUserEvents(eventsData);
        setEvents(formattedEvents);
        
        // Get updated data info
        const updatedInfo = await getEventsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        setDataSource(updatedInfo.source);
      }
    } catch (err) {
      console.error('Error fetching events:', err instanceof Error ? err.message : 'Unknown error');
      setError('No se pudieron cargar los eventos. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, []);

  // Obtener los días únicos para el filtro
  const uniqueDays = [...new Set(events.map(event => event.day))].sort();

  // Filtrar eventos según el término de búsqueda y el día seleccionado
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDay = filterDay ? event.day === filterDay : true;
    return matchesSearch && matchesDay;
  });

  const handleRefresh = () => {
    if (refreshing) return; // Evitar múltiples clics
    setRefreshing(true);
    fetchEventsData(true);
  };
  
  const toggleOfflineMode = () => {
    setOfflineMode(!isOfflineMode);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 pt-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/home" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold">Todos los Eventos</h1>
          </div>
          <div className="flex gap-2">
            <button 
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
              onClick={toggleOfflineMode}
            >
              {isOfflineMode ? (
                <WifiOff size={20} className="text-yellow-400" />
              ) : (
                <Wifi size={20} className="text-green-400" />
              )}
            </button>
            
            <button 
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
              onClick={handleRefresh}
              disabled={refreshing || isOfflineMode}
            >
              <RefreshCw size={20} className={`${refreshing ? 'animate-spin text-[#7065ef]' : 'text-gray-300'}`} />
            </button>
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

        {/* Search and Filters */}
        <div className="px-4">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar eventos..."
              className="w-full bg-gray-800 rounded-full py-3 px-5 pl-12 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Day filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
            <button
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                filterDay === null ? 'bg-[#7065ef] text-white' : 'bg-gray-800 text-gray-300'
              }`}
              onClick={() => setFilterDay(null)}
            >
              Todos
            </button>
            {uniqueDays.map((day) => (
              <button
                key={day}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                  filterDay === day ? 'bg-[#7065ef] text-white' : 'bg-gray-800 text-gray-300'
                }`}
                onClick={() => setFilterDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
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

        {/* Events List */}
        <div className="px-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
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
                <div className="text-center py-8 text-gray-400">
                  No se encontraron eventos que coincidan con tu búsqueda
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllEvents;