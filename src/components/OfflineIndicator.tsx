import React from 'react';
import { WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const OfflineIndicator: React.FC = () => {
  const { isOfflineMode } = useAuth();
  
  if (!isOfflineMode) return null;
  
  return (
    <div className="bg-yellow-500/20 border-t border-yellow-500 text-yellow-100 px-4 py-2 text-sm fixed bottom-16 left-0 right-0 z-10">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <WifiOff size={16} className="mr-2" />
          <span>Sin conexión a internet</span>
        </div>
        <div className="text-xs opacity-80">
          Algunas funciones pueden no estar disponibles
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;