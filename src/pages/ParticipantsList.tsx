import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Search, Info, Calendar, Mic, Users, Wrench, User, PenTool as Tool } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchParticipants, forceParticipantsUpdate } from '../services/userService';
import { Participant } from '../types';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ParticipantsList: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dataSource, setDataSource] = useState<string>('');
  const { isOfflineMode } = useAuth();

  const navItems = [
    { icon: <Calendar size={24} />, label: 'Inicio', active: false, path: '/' },
    { icon: <Mic size={24} />, label: 'Speakers', active: false, path: '/speakers' },
    { icon: <Users size={24} />, label: 'Participantes', active: true, path: '/participants' },
    { icon: <Tool size={24} />, label: 'Herramientas', active: false, path: '/tools' },
    { icon: <User size={24} />, label: 'Perfil', active: false, path: '/profile' }
  ];

  const loadParticipants = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      if (isOfflineMode && forceRefresh) {
        setError('No se pueden actualizar los datos en modo sin conexión');
        setTimeout(() => setError(''), 3000);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const participantsData = await fetchParticipants();
      console.log('Datos recibidos de la API:', participantsData);

      const transformedData = participantsData.map(participant => ({
        id: participant.id,
        name: `${participant.firstName} ${participant.lastName}`,
        role: `${participant.email}`,
        activity: `${participant.role}`,
        imageUrl: `${participant.photoUrl}`,
        email: participant.email,
      }));

      const sortedParticipants = transformedData.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      setParticipants(sortedParticipants);
      console.log('Participantes actualizados:', sortedParticipants);
      
      const storedSource = sessionStorage.getItem('user_data_source');
      setDataSource(storedSource ? JSON.parse(storedSource) : 'local');
    } catch (error) {
      console.error('Error loading participants:', error);
      setError('No se pudieron cargar los participantes. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    loadParticipants(true);
  };

  const filteredParticipants = participants.filter(participant => {
    const fullName = participant.name.toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();

    return (
      fullName.includes(searchTermLower) ||
      (participant.email && participant.email.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        <div className="p-4 pt-6 flex items-center justify-between">
          <div className="flex items-center">

            <div>
              <h1 className="text-2xl font-bold">Lista de Participantes</h1>
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar participantes..."
              className="w-full bg-gray-800 rounded-full py-3 px-5 pl-12 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {error && (
          <div className={`mx-4 mb-4 px-4 py-2 rounded-lg ${
            error.includes('actualizados correctamente')
              ? 'bg-green-500/20 border border-green-500 text-green-100' 
              : 'bg-red-500/20 border border-red-500 text-red-100'
          }`}>
            {error}
          </div>
        )}

        <div className="px-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map(participant => (
                  <Link to={`/participant/${participant.id}`} key={participant.id}>
                    <div className="bg-gray-800 rounded-xl p-4 flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={participant.imageUrl} 
                          alt={participant.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
                          }}
                        />
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{participant.name}</h3>
                        <p className="text-sm text-gray-400 truncate">{participant.role}</p>
                        {participant.activity && participant.activity !== '-' && (
                          <p className="text-xs text-[#7065ef] mt-1 truncate">{participant.activity}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No se encontraron participantes que coincidan con tu búsqueda
                </div>
              )}
            </div>
          )}
        </div>

        <Navbar items={navItems} />
      </div>
    </div>
  );
};

export default ParticipantsList;