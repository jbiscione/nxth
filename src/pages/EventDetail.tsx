import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Clock, Calendar, User, RefreshCw, Video } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Event } from '../types';
import { fetchEvents, forceEventsUpdate, getEventsDataInfo } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import DataStatusIndicator from '../components/DataStatusIndicator';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { isOfflineMode } = useAuth();

  const fetchEventData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // If offline mode is enabled and force refresh is requested, show error
      if (isOfflineMode && forceRefresh) {
        setError('No se pueden actualizar los datos en modo sin conexión');
        setTimeout(() => setError(''), 3000);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Get data info first
      const dataInfo = await getEventsDataInfo();
      setLastUpdated(dataInfo.lastUpdated);
      setDataSource(dataInfo.source);
      
      // If force refresh is requested, use the force update service
      if (forceRefresh) {
        const result = await forceEventsUpdate();
        if (result.success && result.events) {
          const eventData = result.events.find(e => e.id === Number(id));
          if (eventData) {
            setEvent(eventData);
            setDataSource(result.source || null);
            setError('Datos actualizados correctamente');
            setTimeout(() => setError(''), 3000);
          } else {
            setError('No se encontró información del evento después de actualizar.');
          }
        } else {
          setError(result.message || 'Error al actualizar los datos');
          setDataSource(result.source || null);
        }
        
        // Update last updated info
        const updatedInfo = await getEventsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
      } else {
        // Get events normally
        const events = await fetchEvents();
        const eventData = events.find(e => e.id === Number(id));
        
        if (eventData) {
          setEvent(eventData);
        } else {
          setError('No se encontró información del evento.');
        }
        
        // Get updated data info
        const updatedInfo = await getEventsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        setDataSource(updatedInfo.source);
      }
    } catch (err) {
      console.error('Error fetching event data:', err instanceof Error ? err.message : 'Unknown error');
      setError('No se pudo cargar la información del evento. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const handleRefresh = async () => {
    if (refreshing) return; // Evitar múltiples clics
    setRefreshing(true);
    await fetchEventData(true);
  };

  // Verificar si la URL de la imagen es válida
  const isValidImageUrl = (url?: string): boolean => {
    if (!url) return false;
    return url.startsWith('https://') || url.startsWith('http://');
  };

  // Determinar la URL de la imagen a mostrar
  const getImageUrl = (): string => {
    if (imageError || !event || !isValidImageUrl(event.photo)) {
      return "https://nexthumans.net/wp-content/uploads/2024/04/nxth-2.png";
    }
    return event.photo!;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7065ef]"></div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <Link to="/home" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <ArrowLeft size={20} />
        </Link>
        <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded">
          {error || 'No se encontró información del evento.'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <Link to="/home" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              disabled={refreshing || isOfflineMode}
              className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ${(refreshing || isOfflineMode) ? 'opacity-50' : ''}`}
            >
              <RefreshCw size={20} className={`text-gray-300 ${refreshing ? 'animate-spin text-[#7065ef]' : ''}`} />
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

        {/* Event Image */}
        <div className="px-4">
          <div className="relative rounded-xl overflow-hidden aspect-square">
            <img 
              src={getImageUrl()} 
              alt={event?.activity} 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        </div>

        {/* Event Info */}
        <div className="px-4 mt-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <span className="bg-[#7065ef] text-white text-xs font-bold px-2 py-1 rounded-full">
                {event?.day}
              </span>
            </div>
            <h2 className="text-xl font-bold">{event?.activity}</h2>
            
            {/* Date and Time */}
            <div className="flex items-center text-gray-400 mt-3">
              <Calendar size={16} className="mr-2" />
              <span>{event?.date}</span>
            </div>
            
            <div className="flex items-center text-gray-400 mt-2">
              <Clock size={16} className="mr-2" />
              <span>{event?.startTime} - {event?.endTime}</span>
            </div>
            
            {/* Location */}
            {event?.location && event.location !== 'NA' && (
              <div className="flex items-center text-gray-400 mt-2">
                <MapPin size={16} className="mr-2" />
                <span>{event.location}</span>
              </div>
            )}
            
            {/* Facilitator */}
            {event?.facilitator && event.facilitator !== 'NA' && (
              <div className="flex items-center text-gray-400 mt-2">
                <User size={16} className="mr-2" />
                <span>{event.facilitator}</span>
              </div>
            )}

            {/* Video Button */}
            {event?.video && event.video !== '' && (
              <div className="mt-4">
                <a 
                  href={event.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-4 py-2 bg-[#7065ef] text-white rounded-lg hover:bg-[#5a51d4] transition-colors"
                >
                  <Video size={16} className="mr-2" />
                  <span>Ver Video</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Comentarios */}
        {event?.comments && event.comments !== '' && (
          <div className="px-4 mt-3">
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold mb-2">Comentarios</h3>
              <p className="text-sm text-gray-300">{event.comments}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;