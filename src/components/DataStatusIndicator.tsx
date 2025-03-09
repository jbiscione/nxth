import React from 'react';
import { Database, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DataStatusIndicatorProps {
  source: string | null;
  lastUpdated: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  hideSuccessIndicator?: boolean;
}

const DataStatusIndicator: React.FC<DataStatusIndicatorProps> = ({
  source,
  lastUpdated,
  isLoading,
  onRefresh,
  hideSuccessIndicator = false
}) => {
  // Format the last updated time
  const formatLastUpdated = (dateString: string | null): string => {
    if (!dateString) return 'Nunca';
    
    try {
      const date = new Date(dateString);
      
      // If it's today, show time only
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return `Hoy a las ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      // Otherwise show date and time
      return date.toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  // Get status color and icon based on source
  const getStatusInfo = () => {
    if (isLoading) {
      return {
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        borderColor: 'border-blue-400/30',
        icon: <RefreshCw size={16} className="animate-spin mr-1.5" />,
        text: 'Actualizando datos...'
      };
    }
    
    switch (source) {
      case 'external_api':
        return {
          color: hideSuccessIndicator ? 'text-gray-400' : 'text-green-400',
          bgColor: hideSuccessIndicator ? 'bg-gray-400/10' : 'bg-green-400/10',
          borderColor: hideSuccessIndicator ? 'border-gray-400/30' : 'border-green-400/30',
          icon: hideSuccessIndicator ? <Database size={16} className="mr-1.5" /> : <CheckCircle size={16} className="mr-1.5" />,
          text: 'Datos de API externa'
        };
      case 'local_csv':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/30',
          icon: <Database size={16} className="mr-1.5" />,
          text: 'Datos locales'
        };
      case 'hardcoded':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          borderColor: 'border-blue-400/30',
          icon: <Database size={16} className="mr-1.5" />,
          text: 'Datos predeterminados'
        };
      case 'cache':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30',
          icon: <Clock size={16} className="mr-1.5" />,
          text: 'Datos en caché'
        };
      case 'error':
      case 'none':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/30',
          icon: <AlertTriangle size={16} className="mr-1.5" />,
          text: 'Error de datos'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          borderColor: 'border-gray-400/30',
          icon: <Database size={16} className="mr-1.5" />,
          text: 'Estado desconocido'
        };
    }
  };
  
  const statusInfo = getStatusInfo();
  
  // If hideSuccessIndicator is true and source is external_api, don't show the component at all
  if (hideSuccessIndicator && source === 'external_api' && !isLoading) {
    return null;
  }
  
  return (
    <div className={`flex flex-col ${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-2 text-sm`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </div>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className={`p-1 rounded-full hover:bg-gray-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-400' : 'text-gray-400'} />
        </button>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Última actualización: {formatLastUpdated(lastUpdated)}
      </div>
    </div>
  );
};

export default DataStatusIndicator;