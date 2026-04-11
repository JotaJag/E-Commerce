import { useState, useEffect } from 'react';

function GestionColecciones() {
  const [colecciones, setColecciones] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [coleccionEditar, setColeccionEditar] = useState(null);

  useEffect(() => {
    cargarColecciones();
  }, []);

  const cargarColecciones = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/colecciones/');
      const data = await response.json();
      setColecciones(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = localStorage.getItem('token');

    // Si no hay imagen nueva en edición, eliminar el campo vacío
    if (coleccionEditar && !formData.get('imagen').size) {
      formData.delete('imagen');
    }

    try {
      const url = coleccionEditar 
        ? `http://localhost:8000/api/colecciones/${coleccionEditar.id}/`
        : 'http://localhost:8000/api/colecciones/';
      
      const method = coleccionEditar ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData
      });

      if (response.ok) {
        cargarColecciones();
        setModalAbierto(false);
        setColeccionEditar(null);
      } else {
        alert('Error al guardar la colección');
      }
    } catch (error) {
      alert('Error al guardar la colección');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta colección? Esto puede afectar a los productos asociados.')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/colecciones/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        cargarColecciones();
      } else {
        alert('Error al eliminar la colección');
      }
    } catch (error) {
    }
  };

  return (
    <div className="admin-section">
      <h2>Gestión de Colecciones</h2>
      
      <div className="admin-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => {
          setColeccionEditar(null);
          setModalAbierto(true);
        }}>
          Nueva Colección
        </button>
      </div>

      <table className="admin-table table-actions-double">
        <thead>
          <tr>
            <th>ID</th>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {colecciones.map(coleccion => (
            <tr key={coleccion.id}>
              <td>{coleccion.id}</td>
              <td>
                {coleccion.imagen_url && (
                  <img 
                    src={coleccion.imagen_url} 
                    alt={coleccion.nombre}
                    style={{
                      width: '50px',
                      height: '50px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                )}
              </td>
              <td>{coleccion.nombre}</td>
              <td style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {coleccion.descripcion}
              </td>
              <td className="table-actions">
                <button 
                  className="btn-admin btn-admin-secondary"
                  onClick={() => {
                    setColeccionEditar(coleccion);
                    setModalAbierto(true);
                  }}
                >
                  Editar
                </button>
                <button 
                  className="btn-admin btn-admin-danger"
                  onClick={() => handleEliminar(coleccion.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {colecciones.length === 0 && (
        <div className="no-data">No hay colecciones creadas</div>
      )}

      {modalAbierto && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{coleccionEditar ? 'Editar Colección' : 'Nueva Colección'}</h3>
              <button className="admin-modal-close" onClick={() => {
                setModalAbierto(false);
                setColeccionEditar(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Nombre de la Colección *</label>
                <input 
                  type="text" 
                  name="nombre" 
                  defaultValue={coleccionEditar?.nombre}
                  required 
                  placeholder="Ej: Colección Gaming 2024"
                />
              </div>
              <div className="admin-form-group">
                <label>Descripción *</label>
                <textarea 
                  name="descripcion" 
                  defaultValue={coleccionEditar?.descripcion}
                  required
                  rows="4"
                  placeholder="Describe la colección..."
                />
              </div>
              <div className="admin-form-group">
                <label>Imagen {!coleccionEditar && '*'}</label>
                {coleccionEditar && coleccionEditar.imagen_url && (
                  <div style={{marginBottom: '0.5rem'}}>
                    <img 
                      src={coleccionEditar.imagen_url} 
                      alt="Imagen actual" 
                      style={{width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px'}}
                    />
                    <p style={{fontSize: '0.85rem', color: '#666', marginTop: '0.5rem'}}>
                      Selecciona una nueva imagen para reemplazar la actual
                    </p>
                  </div>
                )}
                <input 
                  type="file" 
                  name="imagen" 
                  accept="image/*"
                  required={!coleccionEditar}
                />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-admin btn-admin-secondary" onClick={() => {
                  setModalAbierto(false);
                  setColeccionEditar(null);
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin btn-admin-success">
                  {coleccionEditar ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionColecciones;
