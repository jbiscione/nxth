import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Agregar un evento para forzar la recarga de la página cuando se detecta que está en caché
window.addEventListener('load', () => {
  // Verificar si la página está siendo cargada desde caché
  const pageLoadTime = new Date().getTime();
  const lastUpdateTime = sessionStorage.getItem('app_last_update');
  
  if (lastUpdateTime) {
    const timeDiff = pageLoadTime - parseInt(lastUpdateTime);
    // Si han pasado más de 5 minutos desde la última actualización, forzar recarga
    if (timeDiff > 5 * 60 * 1000) {
      console.log('Forzando actualización de la aplicación...');
      sessionStorage.setItem('app_last_update', pageLoadTime.toString());
      
      // Agregar un parámetro a la URL para evitar caché
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('t', Date.now().toString());
      window.location.href = newUrl.toString();
    }
  } else {
    sessionStorage.setItem('app_last_update', pageLoadTime.toString());
  }
});

// Agregar un manejador para errores no capturados
window.addEventListener('error', (event) => {
  console.error('Error no capturado:', event.error);
  
  // Si el error es grave, recargar la página
  if (event.error && event.error.message && 
      (event.error.message.includes('postMessage') || 
       event.error.message.includes('clone') || 
       event.error.message.includes('Symbol()'))) {
    
    console.warn('Detectado error grave. Recargando página...');
    
    // Prevenir que el error se propague
    event.preventDefault();
    
    // Recargar la página con un parámetro para forzar actualización
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('t', Date.now().toString());
    window.location.href = newUrl.toString();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);