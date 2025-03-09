import React, { useEffect, useState } from 'react';
import { Search, Linkedin, Instagram, RefreshCw, List, AlertCircle, Info, Database, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Calendar, Mic, PenTool as Tool, Users,User } from 'lucide-react';
import { Participant } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchParticipants, forceParticipantsUpdate, getParticipantsDataInfo } from '../services/userService';
import DataStatusIndicator from '../components/DataStatusIndicator';

interface ParticipantCardProps {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string;
  linkedinUrl?: string;
  instagramUrl?: string;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ 
  id, 
  firstName, 
  lastName, 
  photoUrl, 
  linkedinUrl, 
  instagramUrl 
}) => {
  const handleSocialClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Link to={`/participant/${id}`} className="block">
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="h-48 overflow-hidden relative">
          <img 
            src={photoUrl} 
            alt={`${firstName} ${lastName}`} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60"></div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-bold text-lg">{firstName} {lastName}</h3>
            <p className="text-sm text-gray-300">Participante</p>
          </div>
        </div>
        <div className="p-3">
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

const Participants: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [showUpdateInfo, setShowUpdateInfo] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { isOfflineMode, setOfflineMode } = useAuth();

  const fetchParticipantsData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (isOfflineMode && forceRefresh) {
        setError('No se pueden actualizar los datos en modo sin conexión');
        setTimeout(() => setError(''), 3000);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const dataInfo = await getParticipantsDataInfo();
      setLastUpdated(dataInfo.lastUpdated);
      setDataSource(dataInfo.source);
      
      if (forceRefresh) {
        const result = await forceParticipantsUpdate();
        if (result.success && result.participants) {
          setParticipants(result.participants);
          setParticipantCount(result.participants.length);
          setDataSource(result.source || 'desconocido');
          setError(`Datos actualizados correctamente. Total: ${result.participants.length} participantes.`);
          
          const updatedInfo = await getParticipantsDataInfo();
          setLastUpdated(updatedInfo.lastUpdated);
        } else {
          setError(result.message || 'Error al actualizar los datos');
          setDataSource(result.source || 'desconocido');
          
          if (result.participants && result.participants.length > 0) {
            setParticipants(result.participants);
            setParticipantCount(result.participants.length);
          }
        }
        setTimeout(() => setError(''), 5000);
      } else {
        const data = await fetchParticipants();
        setParticipantCount(data.length);
        setParticipants(data);
        
        const updatedInfo = await getParticipantsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        setDataSource(updatedInfo.source);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('No se pudieron cargar los participantes. Por favor, intenta de nuevo más tarde.');
      
      try {
        const fallbackData = await fetchParticipants();
        if (fallbackData && fallbackData.length > 0) {
          setParticipants(fallbackData);
          setParticipantCount(fallbackData.length);
          const dataInfo = await getParticipantsDataInfo();
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
    fetchParticipantsData();
  }, []);

  const filteredParticipants = participants.filter(participant => 
    `${participant.firstName} ${participant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navItems = [
    { icon: <Calendar size={24} />, label: 'Inicio', active: false },
    { icon: <Mic size={24} />, label: 'Speakers', active: false },
    { icon: <Users size={24} />, label: 'Participantes', active: true },
    { icon: <Tool size={24} />, label: 'Herramientas', active: false },
    { icon: <User size={24} />, label: 'Perfil', active: false }

  ];

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchParticipantsData(true);
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
        <div className="p-4 pt-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Participantes</h1>
            <p className="text-sm text-gray-400 flex items-center">
              Total: {participantCount} participantes
            </p>
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
              onClick={toggleUpdateInfo}
            >
              <Info size={20} className="text-gray-300" />
            </button>

            <Link 
              to="/participants/list" 
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
            >
              <List size={20} className="text-gray-300" />
            </Link>

          </div>
        </div>

        <div className="px-4 mb-3">
          <DataStatusIndicator 
            source={dataSource}
            lastUpdated={lastUpdated}
            isLoading={refreshing}
            onRefresh={handleRefresh}
            hideSuccessIndicator={true}
          />
        </div>
        
        {showUpdateInfo && (
          <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700">
            <h4 className="font-semibold mb-2">Actualización de Participantes</h4>
            <p className="text-sm text-gray-300 mb-2">
              Los datos de los participantes se actualizan desde múltiples fuentes:
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
            placeholder="Buscar participantes..."
            className="w-full bg-gray-800 rounded-full py-3 px-5 pl-12 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={20} className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {error && (
          <div className={`mx-4 mt-3 px-4 py-2 rounded-lg ${
            error.includes('actualizados correctamente')
              ? 'bg-green-500/20 border border-green-500 text-green-100' 
              : 'bg-red-500/20 border border-red-500 text-red-100'
          }`}>
            {error}
          </div>
        )}

        <div className="px-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map(participant => (
                  <ParticipantCard 
                    key={participant.id}
                    id={participant.id}
                    firstName={participant.firstName}
                    lastName={participant.lastName}
                    photoUrl={participant.photoUrl}
                    linkedinUrl={participant.linkedinUrl}
                    instagramUrl={participant.instagramUrl}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-400">
                  No se encontraron participantes que coincidan con tu búsqueda
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Navbar items={navItems} />
    </div>
  );
};

export default Participants;