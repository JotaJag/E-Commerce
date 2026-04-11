import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Colecciones.css';

function Colecciones() {
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

  if (loading) {
    return <div className="resultados-busqueda-container"><p>Cargando colecciones...</p></div>;
  }

  return (
    <div className="resultados-busqueda-container">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link> / Colecciones
      </div>
      
      <h1 className="titulo-bloque">Nuestras Colecciones</h1>
      <h2 className="subtitulo-bloque">
        {colecciones.length} colección{colecciones.length !== 1 ? 'es' : ''} disponible{colecciones.length !== 1 ? 's' : ''}
      </h2>
      
      <div className="colecciones-grid">
        {colecciones.length > 0 ? (
          colecciones.map(coleccion => (
            <a 
              key={coleccion.id}
              href={`/coleccion/${encodeURIComponent(coleccion.nombre)}`}
              style={{textDecoration: 'none', color: 'inherit', display: 'block'}}
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
                    Ver Productos
                  </div>
                </div>
              </div>
            </a>
          ))
        ) : (
          <p>No hay colecciones disponibles.</p>
        )}
      </div>
    </div>
  );
}

export default Colecciones;
