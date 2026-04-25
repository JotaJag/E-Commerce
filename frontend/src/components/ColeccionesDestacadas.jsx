import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Colecciones.css';
import './Productos.css';

function ColeccionesDestacadas() {
  const [colecciones, setColecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);
  const hasDragged = useRef(false);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.coleccion-link');
      const amount = card ? card.offsetWidth + 18 : 300;
      scrollRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }
  };


  const onMouseDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.pageX;
    scrollStartLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    const delta = e.pageX - dragStartX.current;
    scrollRef.current.scrollLeft = scrollStartLeft.current - delta;
  };

  const onMouseUp = (e) => {
    hasDragged.current = Math.abs(e.pageX - dragStartX.current) > 5;
    isDragging.current = false;
    scrollRef.current.style.cursor = 'grab';
    scrollRef.current.style.userSelect = '';
  };

  useEffect(() => {
    fetch('http://localhost:8000/api/colecciones/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al cargar las colecciones');
        }
        return response.json();
      })
      .then(data => {
        const coleccionesList = Array.isArray(data) ? data : (data.results || []);
        setColecciones(coleccionesList);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading || colecciones.length === 0) {
    return null;
  }

  return (
    <section className="colecciones-destacadas-section" onClick={(e) => e.stopPropagation()}>
      <div className="resultados-busqueda-container">
        <div className="colecciones-header">
          <div className="colecciones-header-titles">
            <h1 className="titulo-bloque">Nuestras Colecciones</h1>
            <h2 className="subtitulo-bloque">Descubre nuestras colecciones exclusivas</h2>
          </div>
          <Link to="/colecciones" className="colecciones-ver-todas">
            Ver todas →
          </Link>
        </div>
        
      <div className="carousel-wrapper">
        <button className="carousel-btn carousel-btn-left" onClick={() => scroll(-1)}>&#8249;</button>
        <div
          className="colecciones-grid scrollable"
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: 'grab', touchAction: 'pan-x' }}
        >
          {colecciones.map(coleccion => (
            <a
              key={coleccion.id}
              href={`/coleccion/${encodeURIComponent(coleccion.nombre)}`}
              className="coleccion-link"
              onClick={(e) => { if (hasDragged.current) e.preventDefault(); }}
            >
              <div className="coleccion-card">
                <div className="coleccion-image-container">
                  {coleccion.imagen_url && (
                    <img 
                      src={coleccion.imagen_url} 
                      alt={coleccion.nombre}
                      className="coleccion-image"
                    />
                  )}
                </div>
                <div className="coleccion-info">
                  <h2 className="coleccion-titulo">{coleccion.nombre}</h2>
                  <p className="coleccion-descripcion">
                    {coleccion.descripcion}
                  </p>
                  <div className="coleccion-boton">
                    Ver Colección
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
        <button className="carousel-btn carousel-btn-right" onClick={() => scroll(1)}>&#8250;</button>
      </div>
      </div>
    </section>
  );
}

export default ColeccionesDestacadas;
