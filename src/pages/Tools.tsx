import React from 'react';
import { Calendar, Users, PenTool as Tool, User, Download, FileText, Link2, Zap, Database } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface ToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  url?: string;
  comingSoon?: boolean;
  isInternalLink?: boolean;
  internalPath?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ 
  icon, 
  title, 
  description, 
  url, 
  comingSoon,
  isInternalLink,
  internalPath
}) => {
  const handleClick = () => {
    if (comingSoon) return;
    
    if (url && !isInternalLink) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const content = (
    <div 
      className={`bg-gray-800 rounded-xl p-4 ${
        (url || internalPath) && !comingSoon ? 'cursor-pointer hover:bg-gray-700' : ''
      } ${comingSoon ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-full bg-[#7065ef]/20 flex items-center justify-center text-[#7065ef]">
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="font-semibold">{title}</h3>
          {comingSoon && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">Próximamente</span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
  );

  if (isInternalLink && internalPath && !comingSoon) {
    return <Link to={internalPath}>{content}</Link>;
  }

  return (
    <div onClick={handleClick}>
      {content}
    </div>
  );
};

const Tools: React.FC = () => {
  const navItems = [
    { icon: <Calendar size={24} />, label: 'Inicio', active: false },
    { icon: <Users size={24} />, label: 'Speakers', active: false },
    { icon: <User size={24} />, label: 'Participantes', active: false },
    { icon: <Tool size={24} />, label: 'Herramientas', active: true },
  ];

  const tools = [
    {
      icon: <FileText size={20} />,
      title: 'Agenda Completa',
      description: 'Descarga la agenda completa del evento en formato PDF',
      url: 'https://nexthumans.net/agenda-tandil-2025.pdf'
    },
    {
      icon: <Link2 size={20} />,
      title: 'Presentaciones',
      description: 'Accede a las presentaciones de los speakers',
      url: 'https://nexthumans.net/presentaciones'
    },
    {
      icon: <Download size={20} />,
      title: 'Recursos',
      description: 'Material complementario y recursos adicionales',
      url: 'https://nexthumans.net/recursos'
    },
    {
      icon: <Database size={20} />,
      title: 'Verificar API',
      description: 'Herramienta para verificar el estado de la API de participantes',
      isInternalLink: true,
      internalPath: '/check-endpoint'
    },
    {
      icon: <Zap size={20} />,
      title: 'Networking',
      description: 'NeXthumans Connect, una herramienta de IA para conectar con otros participantes',
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-md mx-auto pb-20">
        {/* Header */}
        <div className="p-4 pt-6">
          <h1 className="text-2xl font-bold">Herramientas</h1>
          <p className="text-gray-400 mt-1">Recursos y herramientas para el evento</p>
        </div>

        {/* Tools Grid */}
        <div className="px-4 mt-4 space-y-4">
          {tools.map((tool, index) => (
            <ToolCard 
              key={index}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              url={tool.url}
              comingSoon={tool.comingSoon}
              isInternalLink={tool.isInternalLink}
              internalPath={tool.internalPath}
            />
          ))}
        </div>

        {/* Info Section */}
        <div className="px-4 mt-8">
          <div className="bg-[#7065ef]/10 border border-[#7065ef]/20 rounded-xl p-4">
            <h3 className="font-semibold text-[#7065ef]">¿Necesitas ayuda?</h3>
            <p className="text-sm text-gray-300 mt-2">
              Si necesitas asistencia o tienes alguna pregunta sobre las herramientas disponibles, 
              contacta al equipo de soporte en <a href="mailto:soporte@nexthumans.net" className="text-[#7065ef]">soporte@nexthumans.net</a>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navbar items={navItems} />
    </div>
  );
};

export default Tools;