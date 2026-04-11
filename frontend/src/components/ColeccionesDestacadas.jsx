import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Colecciones.css';

function ColeccionesDestacadas() {
  const [colecciones, setColecciones] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        <div className="colecciones-grid">
          {colecciones.slice(0, 4).map(coleccion => (
            <a 
              key={coleccion.id}
              href={`/coleccion/${encodeURIComponent(coleccion.nombre)}`}
              className="coleccion-link"
              onMouseDown={(e) => e.stopPropagation()}
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
      </div>
    </section>
  );
}

export default ColeccionesDestacadas;
