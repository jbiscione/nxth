import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

interface NavbarProps {
  items: NavItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const location = useLocation();
  
  // Update getRoute to include participants
  const getRoute = (label: string): string => {
    switch (label) {
      case 'Inicio':
        return '/home';
      case 'Speakers':
        return '/speakers';
      case 'Participantes':
        return '/participants';
      case 'Herramientas':
        return '/tools';
      case 'Perfil':
        return '/profile';
      default:
        return '/home';
    }
  };

  // Determine if an item is active based on the current route
  const isActive = (label: string): boolean => {
    const route = getRoute(label);
    return location.pathname === route;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {items.map((item, index) => (
          <Link 
            key={index} 
            to={getRoute(item.label)}
            className={`flex flex-col items-center py-3 px-4 ${
              isActive(item.label) ? 'text-[#7065ef]' : 'text-gray-400'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Navbar;