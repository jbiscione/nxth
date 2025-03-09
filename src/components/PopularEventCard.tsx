import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PopularEventCardProps {
  title: string;
  date: string;
  time: string;
  imageUrl: string;
  id?: number;
}

const PopularEventCard: React.FC<PopularEventCardProps> = ({ id, title, date, time, imageUrl }) => {
  // Estado para controlar si la imagen falló al cargar
  const [imageError, setImageError] = React.useState(false);

  // Limitar el título a 25 caracteres y añadir puntos suspensivos si es necesario
  const truncateTitle = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Verificar si la URL de la imagen es válida
  const isValidImageUrl = (url: string) => {
    return url && (
      url.startsWith('https://') || 
      url.startsWith('http://')
    );
  };

  // Determinar la URL de la imagen a mostrar
  const displayImageUrl = imageError || !isValidImageUrl(imageUrl) 
    ? "https://nexthumans.net/wp-content/uploads/2024/04/nxth-2.png" 
    : imageUrl;

  const content = (
    <div className="bg-gray-800 rounded-xl overflow-hidden">
      <div className="h-32 overflow-hidden">
        <img 
          src={displayImageUrl} 
          alt={title} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{truncateTitle(title)}</h3>
        <div className="flex items-center text-gray-400 text-xs mt-2">
          <Calendar size={12} className="mr-1 flex-shrink-0" />
          <span className="truncate">{date}</span>
        </div>
        <div className="flex items-center text-gray-400 text-xs mt-1">
          <Clock size={12} className="mr-1 flex-shrink-0" />
          <span className="truncate">{time}</span>
        </div>
      </div>
    </div>
  );

  // Si tenemos un ID, hacemos que sea un enlace al detalle del evento
  if (id) {
    return <Link to={`/event/${id}`}>{content}</Link>;
  }

  // Si no hay ID, simplemente mostramos el contenido sin enlace
  return content;
};

export default PopularEventCard;