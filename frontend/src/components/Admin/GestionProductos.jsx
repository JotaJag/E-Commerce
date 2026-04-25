import { useState, useEffect } from 'react';

function GestionProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [colecciones, setColecciones] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
    cargarColecciones();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/productos/');
      const data = await response.json();
      setProductos(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/categorias/');
      const data = await response.json();
      setCategorias(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
    }
  };

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

    // Manejar el checkbox de estado correctamente
    const estadoCheckbox = e.target.querySelector('input[name="estado"]');
    if (estadoCheckbox) {
      formData.set('estado', estadoCheckbox.checked);
    }

    // Si no hay imagen nueva en edición, eliminar el campo vacío
    if (productoEditar && !formData.get('imagen').size) {
      formData.delete('imagen');
    }

    try {
      const url = productoEditar 
        ? `http://localhost:8000/api/productos/${productoEditar.idProducto}/`
        : 'http://localhost:8000/api/productos/';
      
      const method = productoEditar ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData
      });

      if (response.ok) {
        cargarProductos();
        setModalAbierto(false);
        setProductoEditar(null);
      } else {
        const errorData = await response.json();
        alert('Error al guardar el producto: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      alert('Error al guardar el producto');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/productos/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        cargarProductos();
      } else {
        alert('Error al eliminar el producto');
      }
    } catch (error) {
    }
  };

  const toggleEstado = async (producto) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/productos/${producto.idProducto}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ estado: !producto.estado })
      });

      if (response.ok) {
        cargarProductos();
      } else {
        const errorData = await response.json();
        alert('Error al cambiar el estado: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      alert('Error de red al cambiar el estado');
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.idProducto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="admin-section">
      <h2>Gestión de Productos</h2>
      
      <div className="admin-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => {
          setProductoEditar(null);
          setModalAbierto(true);
        }}>
          Nuevo Producto
        </button>
        <div className="admin-search">
          <input 
            type="text" 
            placeholder="Buscar productos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Imagen</th>
            <th>Nombre</th>
            <th>Precio</th>
            <th>Descuento</th>
            <th>Stock</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map(producto => (
            <tr key={producto.idProducto}>
              <td>{producto.idProducto}</td>
              <td><img src={producto.imagen_url} alt={producto.nombre} /></td>
              <td>{producto.nombre}</td>
              <td>
                {parseFloat(producto.descuento_efectivo) > 0 ? (
                  <span>
                    <span style={{textDecoration: 'line-through', color: '#999', marginRight: '4px'}}>€{producto.precioUnitario}</span>
                    <span style={{color: '#E85B4E', fontWeight: 'bold'}}>€{producto.precio_con_descuento}</span>
                  </span>
                ) : (
                  <span>€{producto.precioUnitario}</span>
                )}
              </td>
              <td>
                {parseFloat(producto.descuento_efectivo) > 0 ? (
                  <span className="admin-badge badge-pendiente">
                    {parseFloat(producto.descuento).toFixed(0) > 0
                      ? `${parseFloat(producto.descuento).toFixed(0)}% propio`
                      : `${parseFloat(producto.descuento_efectivo).toFixed(0)}% colección`}
                  </span>
                ) : (
                  <span style={{color: '#999'}}>—</span>
                )}
              </td>
              <td>
                <span className={`admin-badge ${
                  producto.stock === 0 ? 'badge-inactivo' :
                  producto.stock <= 5 ? 'badge-pendiente' :
                  'badge-activo'
                }`}>
                  {producto.stock} uds
                </span>
              </td>
              <td>{producto.categoria || 'Sin categoría'}</td>
              <td>
                <span className={`admin-badge ${producto.estado ? 'badge-activo' : 'badge-inactivo'}`}>
                  {producto.estado ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button
                    className={`btn-admin ${producto.estado ? 'btn-admin-danger' : 'btn-admin-success'}`}
                    onClick={() => toggleEstado(producto)}
                  >
                    {producto.estado ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    className="btn-admin btn-admin-secondary"
                    onClick={() => {
                      setProductoEditar(producto);
                      setModalAbierto(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-admin btn-admin-danger"
                    onClick={() => handleEliminar(producto.idProducto)}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {productosFiltrados.length === 0 && (
        <div className="no-data">No hay productos que mostrar</div>
      )}

      {modalAbierto && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{productoEditar ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="admin-modal-close" onClick={() => {
                setModalAbierto(false);
                setProductoEditar(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-form-group">
                  <label>ID del Producto *</label>
                  <input 
                    type="text" 
                    name="idProducto" 
                    defaultValue={productoEditar?.idProducto}
                    required 
                    disabled={productoEditar}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Nombre *</label>
                  <input 
                    type="text" 
                    name="nombre" 
                    defaultValue={productoEditar?.nombre}
                    required 
                  />
                </div>
                <div className="admin-form-group admin-form-full">
                  <label>Descripción *</label>
                  <textarea 
                    name="descripcion" 
                    defaultValue={productoEditar?.descripcion}
                    required
                    rows="3"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precioUnitario"
                    defaultValue={productoEditar?.precioUnitario}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Descuento individual (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="descuento"
                    defaultValue={productoEditar?.descuento || 0}
                    min="0"
                    max="100"
                    placeholder="0 = sin descuento"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Stock *</label>
                  <input 
                    type="number" 
                    name="stock" 
                    defaultValue={productoEditar?.stock || 0}
                    required
                    min="0"
                    placeholder="Cantidad disponible"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Categoría</label>
                  <select name="categoria" defaultValue={productoEditar?.categoria || ''}>
                    <option value="">Sin categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Marca</label>
                  <input 
                    type="text" 
                    name="marca" 
                    defaultValue={productoEditar?.marca || ''}
                    placeholder="Ej: Logitech, Razer..."
                  />
                </div>
                <div className="admin-form-group">
                  <label>Modelo</label>
                  <input 
                    type="text" 
                    name="modelo" 
                    defaultValue={productoEditar?.modelo || ''}
                    placeholder="Ej: G502, DeathAdder..."
                  />
                </div>
                <div className="admin-form-group">
                  <label>Colección</label>
                  <select name="coleccion" defaultValue={productoEditar?.coleccion || ''}>
                    <option value="">Sin colección</option>
                    {colecciones.map(col => (
                      <option key={col.id} value={col.id}>{col.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Color</label>
                  <input 
                    type="text" 
                    name="color" 
                    defaultValue={productoEditar?.color || ''}
                    placeholder="Ej: Negro, Blanco, RGB..."
                  />
                </div>
                <div className="admin-form-group">
                  <label>Tipo</label>
                  <input 
                    type="text" 
                    name="tipo" 
                    defaultValue={productoEditar?.tipo || ''}
                    placeholder="Ej: Inalámbrico, Mecánico..."
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label>Imagen {!productoEditar && '*'}</label>
                {productoEditar && productoEditar.imagen_url && (
                  <div style={{marginBottom: '0.5rem'}}>
                    <img 
                      src={productoEditar.imagen_url} 
                      alt="Imagen actual" 
                      style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}}
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
                  required={!productoEditar}
                />
              </div>
              <div className="admin-form-group">
                <label>
                  <input 
                    type="checkbox" 
                    name="estado" 
                    defaultChecked={productoEditar ? productoEditar.estado : true}
                  /> Producto activo
                </label>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-admin btn-admin-secondary" onClick={() => {
                  setModalAbierto(false);
                  setProductoEditar(null);
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin btn-admin-success">
                  {productoEditar ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionProductos;
