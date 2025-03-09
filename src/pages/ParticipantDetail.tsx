import React, { useEffect, useState } from 'react';
import { ArrowLeft, Linkedin, Instagram, RefreshCw, Mail } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Participant } from '../types';
import { fetchParticipants, forceParticipantsUpdate, getParticipantsDataInfo } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import DataStatusIndicator from '../components/DataStatusIndicator';

const ParticipantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { isOfflineMode } = useAuth();

  const fetchParticipantData = async (forceRefresh = false) => {
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
          const participantData = result.participants.find(p => p.id === Number(id));
          if (participantData) {
            setParticipant(participantData);
            setDataSource(result.source || null);
            setError('Datos actualizados correctamente');
            setTimeout(() => setError(''), 3000);
          } else {
            setError('No se encontró información del participante después de actualizar.');
          }
        } else {
          setError(result.message || 'Error al actualizar los datos');
          setDataSource(result.source || null);
        }
        
        const updatedInfo = await getParticipantsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
      } else {
        const participants = await fetchParticipants();
        const participantData = participants.find(p => p.id === Number(id));
        
        if (participantData) {
          setParticipant(participantData);
        } else {
          setError('No se encontró información del participante.');
          setTimeout(() => {
            navigate('/participants');
          }, 3000);
        }
        
        const updatedInfo = await getParticipantsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
        setDataSource(updatedInfo.source);
      }
    } catch (err) {
      console.error('Error fetching participant data:', err);
      setError('No se pudo cargar la información del participante. Por favor, intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchParticipantData();
  }, [id]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await fetchParticipantData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7065ef]"></div>
      </div>
    );
  }

  if (error && !participant) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <Link to="/participants" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <ArrowLeft size={20} />
        </Link>
        <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded">
          {error || 'No se encontró información del participante.'}
        </div>
        <div className="text-center mt-4 text-gray-400">
          Redirigiendo a la lista de participantes...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        <div className="p-4 flex justify-between items-center">
          <Link to="/participants/list" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
            <ArrowLeft size={20} />
          </Link>
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
          <div className="relative rounded-xl overflow-hidden aspect-square">
            <img 
              src={participant?.photoUrl} 
              alt={`${participant?.firstName} ${participant?.lastName}`} 
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
              }}
            />
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{participant?.firstName} {participant?.lastName}</h2>
                <p className="text-gray-400 mt-1">{participant?.role}</p>
              </div>
            </div>
            
            <div className="flex items-center mt-3 space-x-3">
              {participant?.linkedinUrl && participant.linkedinUrl !== '-' && (
                <a 
                  href={participant.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#7065ef]"
                >
                  <Linkedin size={20} />
                </a>
              )}
              {participant?.instagramUrl && participant.instagramUrl !== '-' && (
                <a 
                  href={participant.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#7065ef]"
                >
                  <Instagram size={20} />
                </a>
              )}
              {participant?.email && (
                <a 
                  href={`mailto:${participant.email}`}
                  className="text-gray-400 hover:text-[#7065ef]"
                >
                  <Mail size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDetail;