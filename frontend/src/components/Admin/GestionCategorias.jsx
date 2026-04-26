import { useState, useEffect } from 'react';

function GestionCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditar, setCategoriaEditar] = useState(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/categorias/');
      const data = await response.json();
      setCategorias(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = localStorage.getItem('token');

    const padreId = formData.get('padre');
    const data = {
      nombre: formData.get('nombre'),
      padre: padreId && padreId !== '' ? parseInt(padreId) : null
    };

    try {
      const url = categoriaEditar 
        ? `http://localhost:8000/api/categorias/${categoriaEditar.id}/`
        : 'http://localhost:8000/api/categorias/';
      
      const method = categoriaEditar ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        cargarCategorias();
        setModalAbierto(false);
        setCategoriaEditar(null);
      } else {
        alert('Error al guardar la categoría');
      }
    } catch (error) {
      alert('Error al guardar la categoría');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Esto puede afectar a los productos asociados.')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/categorias/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        cargarCategorias();
      } else {
        alert('Error al eliminar la categoría');
      }
    } catch (error) {
    }
  };

  return (
    <div className="admin-section">
      <h2>Gestión de Categorías</h2>
      
      <div className="admin-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => {
          setCategoriaEditar(null);
          setModalAbierto(true);
        }}>
          Nueva Categoría
        </button>
      </div>

      <table className="admin-table table-actions-double">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Categoría Padre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {[...categorias].sort((a, b) => a.id - b.id).map(categoria => (
            <tr key={categoria.id}>
              <td>{categoria.id}</td>
              <td>{categoria.nombre}</td>
              <td>{categoria.padre_nombre || '-'}</td>
              <td className="table-actions">
                <button 
                  className="btn-admin btn-admin-secondary"
                  onClick={() => {
                    setCategoriaEditar(categoria);
                    setModalAbierto(true);
                  }}
                  style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
                >
                  Editar
                </button>
                <button 
                  className="btn-admin btn-admin-danger"
                  onClick={() => handleEliminar(categoria.id)}
                  style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {categorias.length === 0 && (
        <div className="no-data">No hay categorías creadas</div>
      )}

      {modalAbierto && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{categoriaEditar ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button className="admin-modal-close" onClick={() => {
                setModalAbierto(false);
                setCategoriaEditar(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Nombre de la Categoría *</label>
                <input 
                  type="text" 
                  name="nombre" 
                  defaultValue={categoriaEditar?.nombre}
                  required 
                />
              </div>
              <div className="admin-form-group">
                <label>Categoría Padre (opcional)</label>
                <select name="padre" defaultValue={categoriaEditar?.padre || ''}>
                  <option value="">Sin categoría padre</option>
                  {categorias
                    .filter(c => c.id !== categoriaEditar?.id)
                    .map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-admin btn-admin-secondary" onClick={() => {
                  setModalAbierto(false);
                  setCategoriaEditar(null);
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin btn-admin-success">
                  {categoriaEditar ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionCategorias;
