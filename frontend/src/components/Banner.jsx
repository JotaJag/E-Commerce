import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Banner.css';

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cargamos los banners del backend
  useEffect(() => {
    fetch('http://localhost:8000/api/banners/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al cargar los banners.');
        }
        return response.json();
      })
      .then(data => {
        const bannerList = Array.isArray(data) ? data : (data.results || []);
        setBanners(bannerList);
      })
      .catch(error => {
      });
  }, []);

  // Con esto se cambia el banner cada 10 segundos
  useEffect(() => {
    if (banners.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 10000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const nextBanner = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };
  // Condicional por si no hay banners configurados que muestre un mensaje
  if (banners.length === 0) {
    return (
      <header className="app-banner">
        <div className="banner-content">
          <h2>¡Descubre nuestros productos!</h2>
          <p>Los mejores teclados accesorios custom en tu idioma</p>
        </div>
      </header>
    );
  }
  // Si hay banners, se renderizan
  const currentBanner = banners[currentIndex];

  return (
    <header 
      className="app-banner"
      style={{
        backgroundImage: `url(${currentBanner.imagen_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="banner-overlay"></div>
      <div className="banner-item" aria-live="polite" aria-atomic="true">
        <div className="banner-content">
          <h2>{currentBanner.titulo}</h2>
          <p>{currentBanner.descripcion}</p>
          {currentBanner.enlace && (() => {
            const url = currentBanner.enlace;
            const esEnlaceExterno = url.startsWith('http://') || url.startsWith('https://');
            
            return esEnlaceExterno ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="banner-link">Ver más</a>
            ) : (
              <Link to={url} className="banner-link">Ver más</Link>
            );
          })()}
        </div>
      </div>
      
      {banners.length > 1 && (
        <>
          <button className="banner-btn prev" onClick={prevBanner} aria-label="Banner anterior">❮</button>
          <button className="banner-btn next" onClick={nextBanner} aria-label="Banner siguiente">❯</button>

          <div className="banner-indicators" role="tablist" aria-label="Seleccionar banner">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                role="tab"
                aria-selected={index === currentIndex}
                aria-label={`Banner ${index + 1} de ${banners.length}`}
              />
            ))}
          </div>
        </>
      )}
    </header>
  );
};

export default Banner;