import { useState, useEffect } from 'react';

function GestionPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/pedidos/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const data = await response.json();
      setPedidos(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
    }
  };

  const actualizarEstado = async (pedidoId, nuevoEstado) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/pedidos/${pedidoId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        cargarPedidos();
      } else {
        alert('Error al actualizar el estado');
      }
    } catch (error) {
    }
  };

  const pedidosFiltrados = pedidos.filter(p => 
    p.idPedido.toString().includes(busqueda) ||
    (p.cliente_nombre && p.cliente_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (p.cliente_email && p.cliente_email.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const getEstadoBadgeClass = (estado) => {
    const clases = {
      'pendiente': 'badge-pendiente',
      'preparado': 'badge-info',
      'enviado': 'badge-primary',
      'finalizado': 'badge-activo',
      'cancelado': 'badge-inactivo'
    };
    return clases[estado] || 'badge-pendiente';
  };

  return (
    <div className="admin-section">
      <h2>Gestión de Pedidos</h2>
      
      <div className="admin-actions">
        <div className="admin-search">
          <input 
            type="text" 
            placeholder="Buscar por ID o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <table className="admin-table table-actions-single">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Artículos</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Pago</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {pedidosFiltrados.map(pedido => (
            <tr key={pedido.idPedido}>
              <td>#{pedido.idPedido}</td>
              <td>
                <div>{pedido.cliente_nombre}</div>
                <small style={{color: '#888'}}>{pedido.cliente_email}</small>
              </td>
              <td>
                {pedido.lineas && pedido.lineas.length > 0 ? (
                  <div>
                    {pedido.lineas.map(linea => (
                      <div key={linea.id} style={{fontSize: '0.9rem', marginBottom: '0.2rem'}}>
                        {linea.producto_nombre} (x{linea.cantidad})
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{color: '#888'}}>Sin productos</span>
                )}
              </td>
              <td>{new Date(pedido.fechaPedido).toLocaleDateString('es-ES')}</td>
              <td>€{pedido.total}</td>
              <td>
                <span className={`admin-badge ${pedido.pagado ? 'badge-pagado' : 'badge-pendiente'}`}>
                  {pedido.pagado ? 'Pagado' : 'Pendiente'}
                </span>
              </td>
              <td>
                <select 
                  value={pedido.estado} 
                  onChange={(e) => actualizarEstado(pedido.idPedido, e.target.value)}
                  className={`admin-badge ${getEstadoBadgeClass(pedido.estado)}`}
                  style={{border: 'none', cursor: 'pointer'}}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="preparado">Preparado</option>
                  <option value="enviado">Enviado</option>
                  <option value="finalizado">Finalizado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </td>
              <td className="table-actions">
                <button 
                  className="btn-admin btn-admin-secondary"
                  onClick={() => setPedidoDetalle(pedido)}
                  style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
                >
                  Ver Detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pedidosFiltrados.length === 0 && (
        <div className="no-data">No hay pedidos que mostrar</div>
      )}

      {pedidoDetalle && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>Detalles del Pedido #{pedidoDetalle.idPedido}</h3>
              <button className="admin-modal-close" onClick={() => setPedidoDetalle(null)}>×</button>
            </div>
            <div>
              <p><strong>Cliente:</strong> {pedidoDetalle.cliente_nombre}</p>
              <p><strong>Email:</strong> {pedidoDetalle.cliente_email}</p>
              <p><strong>Fecha:</strong> {new Date(pedidoDetalle.fechaPedido).toLocaleDateString('es-ES')}</p>
              <p><strong>Dirección:</strong> {pedidoDetalle.direccionEntrega}, {pedidoDetalle.ciudadEntrega}, {pedidoDetalle.provinciaEntrega}</p>
              <p><strong>Código Postal:</strong> {pedidoDetalle.codPostalEntrega}</p>
              <p><strong>Teléfono:</strong> {pedidoDetalle.telefono}</p>
              <p><strong>Total:</strong> €{pedidoDetalle.total}</p>
              <p><strong>Estado:</strong> {pedidoDetalle.estado_display || pedidoDetalle.estado}</p>
              
              <h4 style={{marginTop: '1.5rem', marginBottom: '1rem'}}>Productos:</h4>
              {pedidoDetalle.lineas && pedidoDetalle.lineas.map(linea => (
                <div key={linea.id} style={{marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px'}}>
                  <p><strong>{linea.producto_nombre}</strong></p>
                  <p>Cantidad: {linea.cantidad} x €{linea.precio_congelado} = €{linea.subtotal}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionPedidos;
