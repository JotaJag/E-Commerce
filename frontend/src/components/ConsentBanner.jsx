import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ConsentBanner.css';

function ConsentBanner() {
  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya aceptó las cookies
    const cookiesAceptadas = localStorage.getItem('cookiesAceptadas');
    if (!cookiesAceptadas) {
      setMostrarBanner(true);
    }
  }, []);

  useEffect(() => {
    // Bloquear scroll del body cuando el banner está visible
    if (mostrarBanner) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Limpiar al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mostrarBanner]);

  const aceptarCookies = () => {
    localStorage.setItem('cookiesAceptadas', 'true');
    localStorage.setItem('cookiesNecesarias', 'true');
    localStorage.setItem('cookiesAnaliticas', 'true');
    localStorage.setItem('cookiesMarketing', 'true');
    setMostrarBanner(false);
  };

  const aceptarSoloNecesarias = () => {
    localStorage.setItem('cookiesAceptadas', 'true');
    localStorage.setItem('cookiesNecesarias', 'true');
    localStorage.setItem('cookiesAnaliticas', 'false');
    localStorage.setItem('cookiesMarketing', 'false');
    setMostrarBanner(false);
  };

  const rechazarCookies = () => {
    localStorage.setItem('cookiesAceptadas', 'true');
    localStorage.setItem('cookiesNecesarias', 'true');
    localStorage.setItem('cookiesAnaliticas', 'false');
    localStorage.setItem('cookiesMarketing', 'false');
    setMostrarBanner(false);
  };

  if (!mostrarBanner) return null;

  return (
    <div className="consent-banner-overlay">
      <div className="consent-banner">
        <div className="consent-banner-content">
          <div className="consent-banner-texto">
            <h3>Política de Cookies y Privacidad</h3>
            <p>
              Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación, 
              analizar el tráfico del sitio y personalizar el contenido. 
              {' '}
              <Link to="/politica-privacidad" className="consent-link">
                Política de Privacidad
              </Link>
              {' y '}
              <Link to="/terminos-condiciones" className="consent-link">
                Términos y Condiciones
              </Link>
            </p>

            {mostrarDetalles && (
              <div className="consent-detalles">
                <div className="consent-tipo">
                  <h4>Cookies Necesarias</h4>
                  <p>
                    Esenciales para el funcionamiento del sitio web. 
                    Permiten la navegación y el uso de funciones básicas. No se pueden desactivar.
                  </p>
                </div>
                <div className="consent-tipo">
                  <h4>Cookies Analíticas</h4>
                  <p>
                    Nos ayudan a entender cómo los visitantes interactúan con el sitio web, 
                    recopilando información de forma anónima.
                  </p>
                </div>
                <div className="consent-tipo">
                  <h4>Cookies de Marketing</h4>
                  <p>
                    Se utilizan para rastrear a los visitantes en los sitios web con la intención 
                    de mostrar anuncios relevantes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="consent-banner-acciones">
          <button 
            className="btn-consent-detalles"
            onClick={() => setMostrarDetalles(!mostrarDetalles)}
          >
            {mostrarDetalles ? 'Ocultar detalles' : 'Ver detalles'}
          </button>
          <button 
            className="btn-consent-rechazar"
            onClick={rechazarCookies}
          >
            Rechazar todo
          </button>
          <button 
            className="btn-consent-necesarias"
            onClick={aceptarSoloNecesarias}
          >
            Solo necesarias
          </button>
          <button 
            className="btn-consent-aceptar"
            onClick={aceptarCookies}
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConsentBanner;
