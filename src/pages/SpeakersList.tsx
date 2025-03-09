import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Search, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchSpeakers, forceSpeakersUpdate } from '../services/speakerService';
import { Speaker } from '../types';
import { useAuth } from '../context/AuthContext';

const SpeakersList: React.FC = () => {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSource, setDataSource] = useState<string>('');
  const { isOfflineMode } = useAuth();

  const loadSpeakers = async (forceRefresh = false) => {
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
      
      // Intentar obtener datos de respaldo
      try {
        const speakersData = await fetchSpeakers();
        
        // Ordenar alfabéticamente por nombre
        const sortedSpeakers = [...speakersData].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setSpeakers(sortedSpeakers);
        
        // Intentar determinar la fuente de datos
        const storedSource = sessionStorage.getItem('speakers_data_source');
        setDataSource(storedSource ? JSON.parse(storedSource) : 'local');
      } catch (fallbackErr) {
        console.error('Error al cargar datos de respaldo:', fallbackErr);
      }
    } catch (error) {
      console.error('Error loading speakers:', error);
      setError('No se pudieron cargar los speakers. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSpeakers();
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    loadSpeakers(true);
  };

  // Filtrar speakers según el término de búsqueda
  const filteredSpeakers = speakers.filter(speaker => 
    speaker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    speaker.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (speaker.activity && speaker.activity .toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 pt-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/speakers" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-4">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Lista de Speakers</h1>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar speakers..."
              className="w-full bg-gray-800 rounded-full py-3 px-5 pl-12 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
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

        {/* Speakers List */}
        <div className="px-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSpeakers.length > 0 ? (
                filteredSpeakers.map(speaker => (
                  <Link to={`/speaker/${speaker.id}`} key={speaker.id}>
                    <div className="bg-gray-800 rounded-xl p-4 flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={speaker.imageUrl} 
                          alt={speaker.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
                          }}
                        />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{speaker.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{speaker.role}</p>
                        {speaker.activity && speaker.activity !== '-' && (
                          <p className="text-xs text-[#7065ef] mt-1 truncate">{speaker.activity}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No se encontraron speakers que coincidan con tu búsqueda
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeakersList;