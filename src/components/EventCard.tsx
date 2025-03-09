import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventCardProps {
  id: number;
  title: string;
  timeRange: string;
  timeLeft: string;
  day?: string; // Propiedad opcional para el día
}

const EventCard: React.FC<EventCardProps> = ({ id, title, timeRange, timeLeft, day }) => {
  // Determinar el color basado en el día (ya no usamos el tiempo restante)
  const getTimeLeftColor = () => {
    return 'text-[#7065ef]'; // Color principal para todos los días
  };

  // Extraer el número del día (por ejemplo, "Día 1" -> "1")
  const getDayNumber = () => {
    if (day && day.includes('Día')) {
      const match = day.match(/\d+/);
      return match ? match[0] : '';
    }
    return '';
  };

  // Limitar el título a un número máximo de caracteres y añadir puntos suspensivos si es necesario
  const truncateTitle = (text: string, maxLength: number = 30) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Link to={`/event/${id}`}>
      <div className="bg-gray-800 rounded-xl p-4 flex justify-between items-center mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className={`text-center ${getTimeLeftColor()} flex-shrink-0`}>
              <div className="text-xl font-bold">{getDayNumber()}</div>
              <div className="text-xs">Día</div>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-semibold truncate">{truncateTitle(title)}</h3>
              <div className="flex items-center text-gray-400 text-sm mt-1">
                <span>{timeRange}</span>
              </div>
            </div>
          </div>
        </div>
        <ChevronRight size={20} className="text-gray-400 flex-shrink-0 ml-1" />
      </div>
    </Link>
  );
};

export default EventCard;