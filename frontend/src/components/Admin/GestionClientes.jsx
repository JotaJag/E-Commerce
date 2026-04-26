import { useState, useEffect } from 'react';

function GestionClientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/clientes/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      const data = await response.json();
      setClientes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = localStorage.getItem('token');

    const data = {
      usuario_email: formData.get('usuario_email'),
      provincia: formData.get('provincia'),
      ciudad: formData.get('ciudad'),
      codigoPostal: formData.get('codigoPostal'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion')
    };

    try {
      const response = await fetch(`http://localhost:8000/api/clientes/${clienteEditar.usuario}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        cargarClientes();
        setModalAbierto(false);
        setClienteEditar(null);
      } else {
        alert('Error al actualizar el cliente');
      }
    } catch (error) {
      alert('Error al actualizar el cliente');
    }
  };

  const clientesFiltrados = clientes
    .filter(c =>
      (c.usuario_nombre && c.usuario_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (c.usuario_email && c.usuario_email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (c.codigoCuenta && c.codigoCuenta.toString().includes(busqueda))
    )
    .sort((a, b) => (a.codigoCuenta || 0) - (b.codigoCuenta || 0));

  return (
    <div className="admin-section">
      <h2>Gestión de Clientes</h2>
      
      <div className="admin-actions">
        <div className="admin-search">
          <input 
            type="text" 
            placeholder="Buscar clientes..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <table className="admin-table table-actions-single">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Provincia</th>
            <th>Ciudad</th>
            <th>Teléfono</th>
            <th>Fecha Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientesFiltrados.map(cliente => (
            <tr key={cliente.usuario}>
              <td>{cliente.codigoCuenta}</td>
              <td>{cliente.usuario_nombre}</td>
              <td>{cliente.usuario_email}</td>
              <td>{cliente.provincia}</td>
              <td>{cliente.ciudad}</td>
              <td>{cliente.telefono}</td>
              <td>{new Date(cliente.fechaRegistro).toLocaleDateString('es-ES')}</td>
              <td className="table-actions">
                <button 
                  className="btn-admin btn-admin-secondary"
                  onClick={() => {
                    setClienteEditar(cliente);
                    setModalAbierto(true);
                  }}
                  style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {clientesFiltrados.length === 0 && (
        <div className="no-data">No hay clientes que mostrar</div>
      )}

      {modalAbierto && clienteEditar && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>Editar Cliente: {clienteEditar.usuario_nombre}</h3>
              <button className="admin-modal-close" onClick={() => {
                setModalAbierto(false);
                setClienteEditar(null);
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="usuario_email"
                  defaultValue={clienteEditar.usuario_email}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Código de Cuenta (no editable)</label>
                <input 
                  type="text" 
                  value={clienteEditar.codigoCuenta}
                  disabled
                />
              </div>
              <div className="admin-form-group">
                <label>Provincia</label>
                <input 
                  type="text" 
                  name="provincia" 
                  defaultValue={clienteEditar.provincia}
                />
              </div>
              <div className="admin-form-group">
                <label>Ciudad</label>
                <input 
                  type="text" 
                  name="ciudad" 
                  defaultValue={clienteEditar.ciudad}
                />
              </div>
              <div className="admin-form-group">
                <label>Código Postal</label>
                <input 
                  type="text" 
                  name="codigoPostal" 
                  defaultValue={clienteEditar.codigoPostal}
                  maxLength="10"
                />
              </div>
              <div className="admin-form-group">
                <label>Teléfono</label>
                <input 
                  type="text" 
                  name="telefono" 
                  defaultValue={clienteEditar.telefono}
                />
              </div>
              <div className="admin-form-group">
                <label>Dirección</label>
                <textarea 
                  name="direccion" 
                  defaultValue={clienteEditar.direccion}
                />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-admin btn-admin-secondary" onClick={() => {
                  setModalAbierto(false);
                  setClienteEditar(null);
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin btn-admin-success">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionClientes;
