import { useState, useEffect } from 'react';

function GestionInventario() {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAjuste, setModalAjuste] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [ajuste, setAjuste] = useState({ tipo: 'add', cantidad: 0, motivo: '' });
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/productos/inventario/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const data = await response.json();
      setProductos(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
    }
  };

  const handleAjusteStock = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const cantidadFinal = ajuste.tipo === 'add' 
      ? parseInt(ajuste.cantidad)
      : -parseInt(ajuste.cantidad);

    try {
      const response = await fetch(`http://localhost:8000/api/productos/${productoSeleccionado.idProducto}/ajustar_stock/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          ajuste: cantidadFinal,
          motivo: ajuste.motivo
        })
      });

      if (response.ok) {
        cargarInventario();
        setModalAjuste(false);
        setProductoSeleccionado(null);
        setAjuste({ tipo: 'add', cantidad: 0, motivo: '' });
      } else {
        const errorData = await response.json();
        alert('Error al ajustar stock: ' + (errorData.error || 'Error desconocido'));
      }
    } catch (error) {
      alert('Error al ajustar stock');
    }
  };

  const abrirModalAjuste = (producto) => {
    setProductoSeleccionado(producto);
    setModalAjuste(true);
    setAjuste({ tipo: 'add', cantidad: 0, motivo: '' });
  };

  const abrirModalHistorial = async (producto) => {
    setProductoSeleccionado(producto);
    setModalHistorial(true);
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/productos/${producto.idProducto}/historial_movimientos/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const data = await response.json();
      setMovimientos(data);
    } catch (error) {
      setMovimientos([]);
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.idProducto.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="admin-section">
      <h2>Gestión de Inventario</h2>
      
      <div className="admin-actions">
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
            <th>Producto</th>
            <th>Stock Total</th>
            <th>Stock Reservado</th>
            <th>Stock Disponible</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productosFiltrados.map(producto => {
            const stockDisponible = producto.stock - (producto.stock_reservado || 0);
            return (
              <tr key={producto.idProducto}>
                <td>{producto.idProducto}</td>
                <td>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <img 
                      src={producto.imagen_url} 
                      alt={producto.nombre}
                      style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}}
                    />
                    <span>{producto.nombre}</span>
                  </div>
                </td>
                <td>
                  <strong>{producto.stock}</strong> uds
                </td>
                <td>
                  <span className="admin-badge badge-pendiente">
                    {producto.stock_reservado || 0} uds
                  </span>
                </td>
                <td>
                  <span className={`admin-badge ${
                    stockDisponible === 0 ? 'badge-inactivo' :
                    stockDisponible <= 5 ? 'badge-pendiente' :
                    'badge-activo'
                  }`}>
                    {stockDisponible} uds
                  </span>
                </td>
                <td>
                  {stockDisponible === 0 ? (
                    <span className="admin-badge badge-inactivo">Sin stock</span>
                  ) : stockDisponible <= 5 ? (
                    <span className="admin-badge badge-pendiente">Stock bajo</span>
                  ) : (
                    <span className="admin-badge badge-activo">Disponible</span>
                  )}
                </td>
                <td className="table-actions">
                  <button 
                    className="btn-admin btn-admin-primary"
                    onClick={() => abrirModalAjuste(producto)}
                    style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
                  >
                    Ajustar Stock
                  </button>
                  <button 
                    className="btn-admin btn-admin-secondary"
                    onClick={() => abrirModalHistorial(producto)}
                    style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem', marginLeft: '0.5rem'}}
                  >
                    Ver Historial
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {productosFiltrados.length === 0 && (
        <div className="no-data">No hay productos que mostrar</div>
      )}

      {modalAjuste && productoSeleccionado && (
        <div className="admin-modal">
          <div className="admin-modal-content" style={{maxWidth: '500px'}}>
            <div className="admin-modal-header">
              <h3>Ajustar Stock - {productoSeleccionado.nombre}</h3>
              <button className="admin-modal-close" onClick={() => {
                setModalAjuste(false);
                setProductoSeleccionado(null);
              }}>✕</button>
            </div>
            
            <div style={{padding: '1rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '1rem'}}>
              <p><strong>Stock actual:</strong> {productoSeleccionado.stock} uds</p>
              <p><strong>Stock reservado:</strong> {productoSeleccionado.stock_reservado || 0} uds</p>
              <p><strong>Stock disponible:</strong> {productoSeleccionado.stock - (productoSeleccionado.stock_reservado || 0)} uds</p>
            </div>

            <form onSubmit={handleAjusteStock}>
              <div className="admin-form-group">
                <label>Tipo de ajuste</label>
                <select 
                  value={ajuste.tipo} 
                  onChange={(e) => setAjuste({...ajuste, tipo: e.target.value})}
                  style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', width: '100%'}}
                >
                  <option value="add">Agregar stock (entrada de mercancía)</option>
                  <option value="remove">Reducir stock (pérdida, daño, devolución)</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Cantidad *</label>
                <input 
                  type="number" 
                  value={ajuste.cantidad}
                  onChange={(e) => setAjuste({...ajuste, cantidad: e.target.value})}
                  min="1"
                  required
                  placeholder="Ej: 10"
                  style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', width: '100%'}}
                />
              </div>

              <div className="admin-form-group">
                <label>Motivo *</label>
                <textarea 
                  value={ajuste.motivo}
                  onChange={(e) => setAjuste({...ajuste, motivo: e.target.value})}
                  required
                  rows="3"
                  placeholder="Ej: Recepción de nueva mercancía, producto dañado, ajuste de inventario..."
                  style={{padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', width: '100%', resize: 'vertical'}}
                />
              </div>

              <div style={{
                background: ajuste.tipo === 'add' ? '#e7f5e7' : '#ffe7e7',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <p style={{margin: 0, fontWeight: 'bold'}}>
                  Stock resultante: {
                    ajuste.tipo === 'add' 
                      ? productoSeleccionado.stock + parseInt(ajuste.cantidad || 0)
                      : productoSeleccionado.stock - parseInt(ajuste.cantidad || 0)
                  } uds
                </p>
              </div>

              <div className="admin-form-actions">
                <button 
                  type="button" 
                  className="btn-admin btn-admin-secondary" 
                  onClick={() => {
                    setModalAjuste(false);
                    setProductoSeleccionado(null);
                  }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`btn-admin ${ajuste.tipo === 'add' ? 'btn-admin-success' : 'btn-admin-danger'}`}
                >
                  {ajuste.tipo === 'add' ? 'Agregar' : 'Reducir'} Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalHistorial && productoSeleccionado && (
        <div className="admin-modal">
          <div className="admin-modal-content" style={{maxWidth: '800px'}}>
            <div className="admin-modal-header">
              <h3>Historial de Movimientos - {productoSeleccionado.nombre}</h3>
              <button className="admin-modal-close" onClick={() => {
                setModalHistorial(false);
                setProductoSeleccionado(null);
                setMovimientos([]);
              }}>×</button>
            </div>
            
            {movimientos.length === 0 ? (
              <div className="no-data">No hay movimientos registrados para este producto</div>
            ) : (
              <table className="admin-table" style={{marginTop: '1rem'}}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Ant.</th>
                    <th>Stock Nuevo</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map(mov => (
                    <tr key={mov.id}>
                      <td>{new Date(mov.fecha).toLocaleString('es-ES')}</td>
                      <td>
                        <span className={`admin-badge ${
                          mov.tipo === 'entrada' ? 'badge-activo' :
                          mov.tipo === 'salida' ? 'badge-inactivo' :
                          mov.tipo === 'venta' ? 'badge-primary' :
                          'badge-pendiente'
                        }`}>
                          {mov.tipo === 'entrada' ? 'Entrada' :
                           mov.tipo === 'salida' ? 'Salida' :
                           mov.tipo === 'venta' ? 'Venta' :
                           'Ajuste'}
                        </span>
                      </td>
                      <td style={{
                        color: mov.cantidad > 0 ? '#4CAF50' : '#E85B4E',
                        fontWeight: 'bold'
                      }}>
                        {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                      </td>
                      <td>{mov.stock_anterior}</td>
                      <td><strong>{mov.stock_nuevo}</strong></td>
                      <td style={{fontSize: '0.9rem'}}>{mov.motivo}</td>
                      <td style={{fontSize: '0.9rem'}}>{mov.usuario_email || 'Sistema'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionInventario;
