import React, { useEffect, useState } from 'react';
import { ArrowLeft, Linkedin, Instagram, RefreshCw, Info, FileText } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Speaker } from '../types';
import { fetchSpeakers, forceSpeakersUpdate, getSpeakersDataInfo } from '../services/speakerService';
import { useAuth } from '../context/AuthContext';
import DataStatusIndicator from '../components/DataStatusIndicator';

const SpeakerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { isOfflineMode } = useAuth();

  const fetchSpeakerData = async (forceRefresh = false) => {
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
      
      // If force refresh is requested, use the force update service
      if (forceRefresh) {
        const result = await forceSpeakersUpdate();
        if (result.success && result.speakers) {
          const speakerData = result.speakers.find(s => s.id === Number(id));
          if (speakerData) {
            setSpeaker(speakerData);
            setDataSource(result.source || null);
            setError('Datos actualizados correctamente');
            setTimeout(() => setError(''), 3000);
          } else {
            setError('No se encontró información del speaker después de actualizar.');
          }
        } else {
          setError(result.message || 'Error al actualizar los datos');
          setDataSource(result.source || null);
        }
        
        // Update last updated info
        const updatedInfo = await getSpeakersDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
      } else {
        // Obtener todos los speakers y encontrar el que coincide con el ID
        const speakers = await fetchSpeakers();
        const speakerData = speakers.find(s => s.id === Number(id));
        
        if (speakerData) {
          setSpeaker(speakerData);
        } else {
          setError('No se encontró información del speaker.');
          // Si no se encuentra el speaker, redirigir a la lista después de un tiempo
          setTimeout(() => {
            navigate('/speakers');
          }, 3000);
        }
        
        // Get updated data info
        const updatedInfo = await getSpeakersDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        setDataSource(updatedInfo.source);
      }
    } catch (err) {
      console.error('Error fetching speaker data:', err instanceof Error ? err.message : 'Unknown error');
      setError('No se pudo cargar la información del speaker. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpeakerData();
  }, [id]);

  const handleRefresh = async () => {
    if (refreshing) return; // Evitar múltiples clics
    setRefreshing(true);
    await fetchSpeakerData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7065ef]"></div>
      </div>
    );
  }

  if (error && !speaker) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <Link to="/speakers" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <ArrowLeft size={20} />
        </Link>
        <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded">
          {error || 'No se encontró información del speaker.'}
        </div>
        <div className="text-center mt-4 text-gray-400">
          Redirigiendo a la lista de speakers...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <Link to="/speakers" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
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

        {/* Speaker Image */}
        <div className="px-4">
          <div className="relative rounded-xl overflow-hidden aspect-square">
            <img 
              src={speaker?.imageUrl} 
              alt={speaker?.name} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback a una imagen genérica si la URL no funciona
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
              }}
            />
          </div>
        </div>

        {/* Speaker Info */}
        <div className="px-4 mt-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{speaker?.name}</h2>
                <p className="text-gray-400 mt-1">{speaker?.role}</p>
              </div>
            </div>
            
            {/* Social Links and Presentation Button */}
            <div className="flex items-center mt-3 space-x-3">
              {speaker?.linkedinUrl && speaker.linkedinUrl !== '-' && (
                <a 
                  href={speaker.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#7065ef]"
                >
                  <Linkedin size={20} />
                </a>
              )}
              {speaker?.instagramUrl && speaker.instagramUrl !== '-' && (
                <a 
                  href={speaker.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#7065ef]"
                >
                  <Instagram size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Activity */}
        {speaker?.activity && speaker.activity !== '-' && (
          <div className="px-4 mt-3">
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold mb-2">Actividad</h3>
              <p className="text-gray-300">{speaker.activity}</p>
            </div>
          </div>
        )}

        {/* Bio */}
        {speaker?.bio && speaker.bio !== '-' && (
          <div className="px-4 mt-3">
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold mb-2">Biografía</h3>
              <p className="text-sm text-gray-300 whitespace-pre-line">{speaker.bio}</p>
            </div>
          </div>
        )}

        {/* Presentacion */}
        {speaker?.bio && speaker.bio !== '-' && (
          <div className="px-4 mt-3">
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold mb-2">Presentación</h3>
              {speaker?.presentation && speaker.presentation !== '-' && (
                <a 
                  href={speaker.presentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 bg-[#7065ef] text-white rounded-lg hover:bg-[#5a51d4] transition-colors"
                >
                  <FileText size={16} className="mr-2" />
                  <span>Presentación</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeakerDetail;