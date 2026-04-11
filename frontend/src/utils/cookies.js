/**
 * Utilidades para gestionar cookies y preferencias del usuario
 */

// Verificar si el usuario ha aceptado las cookies
export const cookiesAceptadas = () => {
  return localStorage.getItem('cookiesAceptadas') === 'true';
};

// Verificar si se pueden usar cookies analíticas
export const puedeUsarCookiesAnaliticas = () => {
  return localStorage.getItem('cookiesAnaliticas') === 'true';
};

// Verificar si se pueden usar cookies de marketing
export const puedeUsarCookiesMarketing = () => {
  return localStorage.getItem('cookiesMarketing') === 'true';
};

// Obtener todas las preferencias de cookies
export const getPreferenciasCookies = () => {
  return {
    aceptadas: cookiesAceptadas(),
    necesarias: localStorage.getItem('cookiesNecesarias') === 'true',
    analiticas: puedeUsarCookiesAnaliticas(),
    marketing: puedeUsarCookiesMarketing(),
  };
};

// Guardar preferencias de cookies
export const guardarPreferenciasCookies = (preferencias) => {
  localStorage.setItem('cookiesAceptadas', 'true');
  localStorage.setItem('cookiesNecesarias', 'true'); // Siempre true
  localStorage.setItem('cookiesAnaliticas', preferencias.analiticas ? 'true' : 'false');
  localStorage.setItem('cookiesMarketing', preferencias.marketing ? 'true' : 'false');
};

// Resetear preferencias de cookies
export const resetearPreferenciasCookies = () => {
  localStorage.removeItem('cookiesAceptadas');
  localStorage.removeItem('cookiesNecesarias');
  localStorage.removeItem('cookiesAnaliticas');
  localStorage.removeItem('cookiesMarketing');
};

// Función para cargar scripts de terceros solo si las cookies están aceptadas
export const cargarScriptAnalytics = (gaId) => {
  if (!puedeUsarCookiesAnaliticas()) return;
  
  // Ejemplo: Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', gaId);
};

// Función para cargar scripts de marketing solo si las cookies están aceptadas
export const cargarScriptMarketing = (pixelId) => {
  if (!puedeUsarCookiesMarketing()) return;
  
  // Ejemplo: Facebook Pixel u otros scripts de marketing
  // Implementar según necesidad
};

export default {
  cookiesAceptadas,
  puedeUsarCookiesAnaliticas,
  puedeUsarCookiesMarketing,
  getPreferenciasCookies,
  guardarPreferenciasCookies,
  resetearPreferenciasCookies,
  cargarScriptAnalytics,
  cargarScriptMarketing,
};
