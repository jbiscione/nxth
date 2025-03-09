import React, { useState, useEffect } from 'react';
import { Calendar, Users, PenTool as Tool, User, LogOut, Linkedin, Instagram, Mail, Camera, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getParticipantsDataInfo, forceParticipantsUpdate } from '../services/userService';
import DataStatusIndicator from '../components/DataStatusIndicator';

const Profile: React.FC = () => {
  const { user, logout, isOfflineMode, setOfflineMode } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const navItems = [
    { icon: <Calendar size={24} />, label: 'Inicio', active: false },
    { icon: <Users size={24} />, label: 'Speakers', active: false },
    { icon: <User size={24} />, label: 'Participantes', active: false },
    { icon: <Tool size={24} />, label: 'Herramientas', active: false },
  ];

  useEffect(() => {
    const loadDataInfo = async () => {
      try {
        const dataInfo = await getParticipantsDataInfo();
        setLastUpdated(dataInfo.lastUpdated);
        setDataSource(dataInfo.source);
      } catch (err) {
        console.error('Error loading data info:', err);
      }
    };
    
    loadDataInfo();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };
  
  const handleRefresh = async () => {
    if (refreshing) return; // Avoid multiple clicks
    
    setRefreshing(true);
    setError('');
    
    try {
      // If offline mode is enabled, show error
      if (isOfflineMode) {
        setError('No se pueden actualizar los datos en modo sin conexión');
        setTimeout(() => setError(''), 3000);
        setRefreshing(false);
        return;
      }
      
      // Force update participants
      const result = await forceParticipantsUpdate();
      if (result.success) {
        setDataSource(result.source || null);
        setError(`Datos de perfil actualizados correctamente.`);
        
        // Update last updated info
        const updatedInfo = await getParticipantsDataInfo();
        setLastUpdated(updatedInfo.lastUpdated);
      } else {
        setError(result.message || 'Error al actualizar los datos');
        setDataSource(result.source || null);
      }
      
      setTimeout(() => setError(''), 3000);
    } catch (error) {
      console.error('Error refreshing profile data:', error);
      setError('Error al actualizar los datos. Inténtalo de nuevo.');
    } finally {
      setRefreshing(false);
    }
  };
  
  const toggleOfflineMode = () => {
    setOfflineMode(!isOfflineMode);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#7065ef] mx-auto mb-4"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 pt-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Mi Perfil</h1>
            <p className="text-gray-400 mt-1">Información personal y configuración</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
              onClick={toggleOfflineMode}
            >
              {isOfflineMode ? (
                <WifiOff size={20} className="text-yellow-400" />
              ) : (
                <Wifi size={20} className="text-green-400" />
              )}
            </button>
            
            <button 
              className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center"
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

        {/* Profile Card */}
        <div className="px-4 mt-4">
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden">
                  <img 
                    src={user.photoUrl || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80"} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                </div>
                <div className="absolute bottom-0 right-0 bg-[#7065ef] rounded-full p-1.5 cursor-pointer">
                  <Camera size={16} />
                </div>
              </div>
              <h2 className="text-xl font-bold mt-4">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-400">Participante NeXthumans 2025</p>
              
              <div className="flex mt-4 space-x-3">
                {user.linkedinUrl && (
                  <a 
                    href={user.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-[#7065ef] hover:text-white"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
                {user.instagramUrl && (
                  <a 
                    href={user.instagramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-[#7065ef] hover:text-white"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                <a 
                  href={`mailto:${user.email}`}
                  className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 hover:bg-[#7065ef] hover:text-white"
                >
                  <Mail size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-4 mt-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Información de contacto</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p>{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="px-4 mt-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="font-semibold mb-3">Configuración</h3>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-gray-300">Modo sin conexión</span>
              </div>
              <button 
                onClick={toggleOfflineMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isOfflineMode ? 'bg-[#7065ef]' : 'bg-gray-600'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isOfflineMode ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-2.5 mt-2 flex items-center justify-center gap-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
            >
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* App Info */}
        <div className="px-4 mt-8">
          <div className="text-center text-gray-500 text-xs">
            <p>NeXthumans App v1.0</p>
            <p className="mt-1">© 2025 NeXthumans. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-xl p-5 w-full max-w-xs">
            <h3 className="font-bold text-lg mb-3">Cerrar sesión</h3>
            <p className="text-gray-300 mb-5">¿Estás seguro que deseas cerrar sesión?</p>
            <div className="flex gap-3">
              <button 
                onClick={cancelLogout}
                className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 py-2 bg-red-500 rounded-lg hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <Navbar items={navItems} />
    </div>
  );
};

export default Profile;