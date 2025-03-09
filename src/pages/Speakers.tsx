import React, { useEffect, useState } from 'react';
import { Search, Linkedin, Instagram, RefreshCw, List, AlertCircle, Info, Database, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Speaker } from '../types';
import { Calendar, Mic, PenTool as Tool, Users, User } from 'lucide-react';
import { fetchSpeakers, forceSpeakersUpdate, getSpeakersDataInfo } from '../services/speakerService';
import { useAuth } from '../context/AuthContext';
import DataStatusIndicator from '../components/DataStatusIndicator';

interface SpeakerCardProps {
  id: number;
  name: string;
  role: string;
  activity: string;
  imageUrl: string;
  linkedinUrl?: string;
  instagramUrl?: string;
}

const SpeakerCard: React.FC<SpeakerCardProps> = ({ 
  id, 
  name, 
  role, 
  activity, 
  imageUrl, 
  linkedinUrl, 
  instagramUrl 
}) => {
  // Handle social media clicks without propagating to parent link
  const handleSocialClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Truncate text to a single line with ellipsis
  const truncateText = (text: string, maxLength: number = 30) => {
    if (!text || text === '-') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link to={`/speaker/${id}`} className="block">
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="h-48 overflow-hidden relative">
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              // Fallback a una imagen genérica si la URL no funciona
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-lg">{name}</h3>
            <p className="text-sm text-gray-300 truncate">{role}</p>
          </div>
        </div>
        <div className="p-3">
          <h4 className="font-semibold truncate">{activity !== '-' ? truncateText(activity) : 'Ponente'}</h4>
          <div className="flex mt-2 space-x-2">
            {linkedinUrl && linkedinUrl !== '-' && (
              <button 
                onClick={(e) => handleSocialClick(e, linkedinUrl)}
                className="text-gray-400 hover:text-[#7065ef]"
              >
                <Linkedin size={18} />
              </button>
            )}
            {instagramUrl && instagramUrl !== '-' && (
              <button 
                onClick={(e) => handleSocialClick(e, instagramUrl)}
                className="text-gray-400 hover:text-[#7065ef]"
              >
                <Instagram size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

const Speakers: React.FC = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [speakerCount, setSpeakerCount] = useState(0);
  const [showUpdateInfo, setShowUpdateInfo] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { isOfflineMode, setOfflineMode } = useAuth();

  const fetchSpeakersData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Si estamos en modo offline y se solicita actualización forzada, mostrar mensaje
      if (isOfflineMode && forceRefresh) {
        setError('No se pueden actualizar los datos en modo sin conexión');
        setTimeout(() => setError(''), 3000);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Get data info first
      const dataInfo = await getSpeakersDataInfo();
      setLastUpdated(dataInfo.lastUpdated);
      setDataSource(dataInfo.source);
      
      // Si se solicita actualización forzada, usar el servicio de actualización forzada
      if (forceRefresh) {
        const result = await forceSpeakersUpdate();
        if (result.success && result.speakers) {
          setSpeakers(result.speakers);
          setSpeakerCount(result.speakers.length);
          setDataSource(result.source || 'desconocido');
          setError(`Datos actualizados correctamente. Total: ${result.speakers.length} speakers (Fuente: ${result.source || 'desconocida'}).`);
          
          // Update last updated info
          const updatedInfo = await getSpeakersDataInfo();
          setLastUpdated(updatedInfo.lastUpdated);
        } else {
          setError(result.message || 'Error al actualizar los datos');
          setDataSource(result.source || 'desconocido');
          
          // Asegurarse de que tenemos datos para mostrar incluso si hay error
          if (result.speakers && result.speakers.length > 0) {
            setSpeakers(result.speakers);
            setSpeakerCount(result.speakers.length);
          }
        }
        setTimeout(() => setError(''), 5000);
      } else {
        // Obtener speakers normalmente
        const data = await fetchSpeakers();
        
        // Verificar que los IDs sean consecutivos
        const sortedData = [...data].sort((a, b) => a.id - b.id);
        
        // Actualizar el contador de speakers
        setSpeakerCount(sortedData.length);
        setSpeakers(sortedData);
        
        // Get updated data info
        const updatedInfo = await getSpeakersDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        setDataSource(updatedInfo.source);
      }
    } catch (err) {
      console.error('Error fetching speakers:', err instanceof Error ? err.message : 'Unknown error');
      setError('No se pudieron cargar los speakers. Por favor, intenta de nuevo más tarde.');
      
      // Intentar obtener datos de respaldo
      try {
        const fallbackData = await fetchSpeakers();
        if (fallbackData && fallbackData.length > 0) {
          setSpeakers(fallbackData);
          setSpeakerCount(fallbackData.length);
          const dataInfo = await getSpeakersDataInfo();
          setLastUpdated(dataInfo.lastUpdated);
          setDataSource(dataInfo.source);
        }
      } catch (fallbackErr) {
        console.error('Error al cargar datos de respaldo:', fallbackErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpeakersData();
  }, []);

  // Filtrar speakers según el término de búsqueda
  const filteredSpeakers = speakers.filter(speaker => 
    speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (speaker.activity && speaker.activity.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Elementos de la barra de navegación
  const navItems = [
    { icon: <Calendar size={24} />, label: 'Inicio', active: false },
    { icon: <Mic size={24} />, label: 'Speakers', active: true },
    { icon: <Users size={24} />, label: 'Participantes', active: false },
    { icon: <Tool size={24} />, label: 'Herramientas', active: false },
    { icon: <User size={24} />, label: 'Perfil', active: false }
  ];

  const handleRefresh = async () => {
    if (refreshing) return; // Evitar múltiples clics
    setRefreshing(true);
    await fetchSpeakersData(true);
  };

  const toggleUpdateInfo = () => {
    setShowUpdateInfo(!showUpdateInfo);
  };
  
  const toggleOfflineMode = () => {
    setOfflineMode(!isOfflineMode);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 pt-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Speakers</h1>
            <p className="text-sm text-gray-400 flex items-center">
              Total: {speakerCount} speakers
            </p>
          </div>
          <div className="flex gap-2">

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
        
        {/* Update Info Tooltip */}
        {showUpdateInfo && (
          <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700">
            <h4 className="font-semibold mb-2">Actualización de Speakers</h4>
            <p className="text-sm text-gray-300 mb-2">
              Los datos de los speakers se actualizan desde múltiples fuentes:
            </p>
            <ul className="text-sm text-gray-300 mb-2 list-disc pl-5 space-y-1">
              <li>API externa (primera prioridad)</li>
              <li>Archivo CSV local (segunda prioridad)</li>
              <li>Caché local (cuando no hay conexión)</li>
            </ul>
            <p className="text-sm text-gray-300 mb-2">
              Fuente actual: <span className="font-semibold">{dataSource || 'desconocida'}</span>
            </p>
            <div className="flex items-center justify-between">
              <button 
                onClick={handleRefresh}
                disabled={refreshing || isOfflineMode}
                className={`text-sm text-[#7065ef] hover:underline flex items-center ${(refreshing || isOfflineMode) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar ahora
              </button>
              
              <button 
                onClick={toggleOfflineMode}
                className="text-sm text-gray-300 hover:underline flex items-center"
              >
                {isOfflineMode ? (
                  <>
                    <Wifi size={14} className="mr-1" />
                    Activar modo online
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="mr-1" />
                    Activar modo offline
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        <div className="px-4 mt-2 relative">
          <input
            type="text"
            placeholder="Buscar speakers..."
            className="w-full bg-gray-800 rounded-full py-3 px-5 pl-12 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={20} className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Mensaje de error o éxito */}
        {error && (
          <div className={`mx-4 mt-3 px-4 py-2 rounded-lg ${
            error.includes('nuevos speakers') || error.includes('actualizados correctamente')
              ? 'bg-green-500/20 border border-green-500 text-green-100' 
              : 'bg-red-500/20 border border-red-500 text-red-100'
          }`}>
            {error}
          </div>
        )}

        {/* Speakers Grid */}
        <div className="px-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredSpeakers.length > 0 ? (
                filteredSpeakers.map(speaker => (
                  <SpeakerCard 
                    key={speaker.id}
                    id={speaker.id}
                    name={speaker.name}
                    role={speaker.role}
                    activity={speaker.activity}
                    imageUrl={speaker.imageUrl}
                    linkedinUrl={speaker.linkedinUrl}
                    instagramUrl={speaker.instagramUrl}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  No se encontraron speakers que coincidan con tu búsqueda
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navbar items={navItems} />
    </div>
  );
};

export default Speakers;