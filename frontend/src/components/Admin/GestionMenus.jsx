import React, { useState, useEffect } from 'react';

function GestionMenus() {
  const [menus, setMenus] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [menuEditar, setMenuEditar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [urlManual, setUrlManual] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [coleccionSeleccionada, setColeccionSeleccionada] = useState('');
  const [colecciones, setColecciones] = useState([]);
  const [tipoEnlace, setTipoEnlace] = useState('categoria'); // 'categoria', 'coleccion', 'personalizado', 'contacto'

  useEffect(() => {
    cargarMenus();
    cargarCategorias();
    cargarColecciones();
  }, []);

  const cargarMenus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/menus/');
      const data = await response.json();
      setMenus(Array.isArray(data) ? data : data.results || []);
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

    const categoriaValue = formData.get('categoria');
    const padreValue = formData.get('padre');
    const tipoEnlaceValue = formData.get('tipoEnlace');
    let urlValue = formData.get('url');

    // Determinar la URL según el tipo de enlace
    if (tipoEnlaceValue === 'contacto') {
      urlValue = '#contacto';
    } else if (tipoEnlaceValue === 'categoria' && categoriaValue && categoriaValue !== '') {
      if (!urlValue || urlValue.trim() === '') {
        urlValue = `/categoria/${categoriaValue}`;
      }
    }

    // Validar que haya URL
    if (!urlValue || urlValue.trim() === '') {
      alert('Debes proporcionar una URL, seleccionar una categoría o elegir un enlace especial');
      return;
    }

    const menuData = {
      nombre: formData.get('nombre'),
      url: urlValue,
      orden: parseInt(formData.get('orden')) || 0,
      categoria: categoriaValue && categoriaValue !== '' ? parseInt(categoriaValue) : null,
      padre: padreValue && padreValue !== '' ? parseInt(padreValue) : null
    };

    try {
      const url = menuEditar 
        ? `http://localhost:8000/api/menus/${menuEditar.id}/`
        : 'http://localhost:8000/api/menus/';
      
      const method = menuEditar ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(menuData)
      });

      if (response.ok) {
        cargarMenus();
        setModalAbierto(false);
        setMenuEditar(null);
        setUrlManual('');
        setCategoriaSeleccionada('');
        setTipoEnlace('categoria');
      } else {
        const errorData = await response.json();
        alert('Error al guardar el menú: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      alert('Error al guardar el menú');
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este menú? Si tiene submenús, también se eliminarán.')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/menus/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        cargarMenus();
      } else {
        const errorData = await response.text();
        alert('Error al eliminar el menú: ' + errorData);
      }
    } catch (error) {
      alert('Error al eliminar el menú: ' + error.message);
    }
  };

  const menusFiltrados = menus
    .filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.id - b.id);

  // Función para renderizar menús de forma recursiva
  const renderMenus = (menuList, nivel = 0) => {
    return menuList.map(menu => (
      <React.Fragment key={menu.id}>
        <tr>
          <td style={{paddingLeft: `${nivel * 2 + 0.75}rem`}}>
            {nivel > 0 && '↳ '}
            {menu.nombre}
          </td>
          <td><code>{menu.url}</code></td>
          <td>{menu.categoria_nombre || 'Sin categoría'}</td>
          <td>{menu.padre_nombre || '-'}</td>
          <td>{menu.orden}</td>
          <td className="table-actions">
            <button 
              className="btn-admin btn-admin-secondary"
              onClick={() => abrirModal(menu)}
              style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
            >
              Editar
            </button>
            <button 
              className="btn-admin btn-admin-danger"
              onClick={() => handleEliminar(menu.id)}
              style={{fontSize: '0.85rem', padding: '0.4rem 0.8rem'}}
            >
              Eliminar
            </button>
          </td>
        </tr>
        {menu.submenus && menu.submenus.length > 0 && renderMenus(menu.submenus, nivel + 1)}
      </React.Fragment>
    ));
  };

  // Obtener solo los menús principales (sin padre)
  const menusPrincipales = menusFiltrados.filter(m => !m.padre_id);

  // Manejar cambio de categoría
  const handleCategoriaChange = (e) => {
    const categoriaId = e.target.value;
    setCategoriaSeleccionada(categoriaId);
    
    if (categoriaId && tipoEnlace === 'categoria') {
      // Si se selecciona una categoría, generar URL automática
      setUrlManual(`/categoria/${categoriaId}`);
    }
  };

  // Manejar cambio de tipo de enlace
  const handleTipoEnlaceChange = (e) => {
    const tipo = e.target.value;
    setTipoEnlace(tipo);
    
    if (tipo === 'contacto') {
      setUrlManual('#contacto');
      setCategoriaSeleccionada('');
    } else if (tipo === 'categoria' && categoriaSeleccionada) {
      setUrlManual(`/categoria/${categoriaSeleccionada}`);
    } else if (tipo === 'personalizado') {
      setUrlManual('');
      setCategoriaSeleccionada('');
    }
  };

  // Manejar apertura del modal
  const abrirModal = (menu = null) => {
    setMenuEditar(menu);
    setModalAbierto(true);
    if (menu) {
      setUrlManual(menu.url);
      setCategoriaSeleccionada(menu.categoria_id || '');
      // Detectar tipo de enlace
      if (menu.url === '#contacto') {
        setTipoEnlace('contacto');
      } else if (menu.categoria_id) {
        setTipoEnlace('categoria');
      } else {
        setTipoEnlace('personalizado');
      }
    } else {
      setUrlManual('');
      setCategoriaSeleccionada('');
      setTipoEnlace('categoria');
    }
  };

  // Manejar cierre del modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setMenuEditar(null);
    setUrlManual('');
    setCategoriaSeleccionada('');
    setTipoEnlace('categoria');
  };

  return (
    <div className="admin-section">
      <h2>Gestión de Menús</h2>
      
      <div className="admin-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => abrirModal()}>
          Nuevo Menú
        </button>
        <div className="admin-search">
          <input 
            type="text" 
            placeholder="Buscar menús..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>URL</th>
            <th>Categoría</th>
            <th>Menú Padre</th>
            <th>Orden</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {renderMenus(menusPrincipales)}
        </tbody>
      </table>

      {menusPrincipales.length === 0 && (
        <div className="no-data">No hay menús que mostrar</div>
      )}

      {modalAbierto && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{menuEditar ? 'Editar Menú' : 'Nuevo Menú'}</h3>
              <button className="admin-modal-close" onClick={cerrarModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Nombre *</label>
                <input 
                  type="text" 
                  name="nombre" 
                  defaultValue={menuEditar?.nombre}
                  placeholder="Ej: Teclados"
                  required 
                />
              </div>

              <div className="admin-form-group">
                <label>Tipo de Enlace *</label>
                <select 
                  name="tipoEnlace" 
                  value={tipoEnlace}
                  onChange={handleTipoEnlaceChange}
                >
                  <option value="categoria">Categoría</option>
                  <option value="personalizado">URL Personalizada</option>
                  <option value="contacto">Modal de Contacto</option>
                </select>
              </div>

              {tipoEnlace === 'categoria' && (
                <div className="admin-form-group">
                  <label>Categoría *</label>
                  <select 
                    name="categoria" 
                    value={categoriaSeleccionada}
                    onChange={handleCategoriaChange}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias
                      .filter(cat => !cat.padre_id)
                      .map(cat => (
                        <React.Fragment key={cat.id}>
                          <option value={cat.id}>{cat.nombre}</option>
                          {categorias
                            .filter(subcat => subcat.padre_id === cat.id)
                            .map(subcat => (
                              <option key={subcat.id} value={subcat.id}>
                                → {subcat.nombre}
                              </option>
                            ))
                          }
                        </React.Fragment>
                      ))
                    }
                  </select>
                  <small style={{color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>
                    Selecciona una categoría padre o subcategoría
                  </small>
                </div>
              )}

              {tipoEnlace === 'personalizado' && (
                <div className="admin-form-group">
                  <label>URL Personalizada *</label>
                  <input 
                    type="text" 
                    name="url" 
                    value={urlManual}
                    onChange={(e) => setUrlManual(e.target.value)}
                    placeholder="Ej: /acerca-de-nosotros"
                    required
                  />
                  <small style={{color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>
                    Escribe una URL personalizada (ej: /acerca-de-nosotros)
                  </small>
                </div>
              )}

              {tipoEnlace === 'contacto' && (
                <div className="admin-form-group">
                  <input type="hidden" name="url" value="#contacto" />
                  <small style={{color: '#666', fontSize: '0.85rem', display: 'block'}}>
                    Este enlace abrirá el modal de contacto
                  </small>
                </div>
              )}

              {tipoEnlace === 'categoria' && (
                <div className="admin-form-group">
                  <label>URL (Generada Automáticamente)</label>
                  <input 
                    type="text" 
                    name="url" 
                    value={urlManual}
                    onChange={(e) => setUrlManual(e.target.value)}
                    placeholder="Se generará automáticamente"
                    readOnly={!categoriaSeleccionada}
                    style={{backgroundColor: categoriaSeleccionada ? '#fff' : '#f5f5f5'}}
                  />
                  <small style={{color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>
                    Puedes editar la URL si lo necesitas
                  </small>
                </div>
              )}
              <div className="admin-form-group">
                <label>Menú Padre</label>
                <select name="padre" defaultValue={menuEditar?.padre || ''}>
                  <option value="">Sin padre (menú principal)</option>
                  {menus
                    .filter(m => !menuEditar || m.id !== menuEditar.id)
                    .map(menu => (
                      <option key={menu.id} value={menu.id}>{menu.nombre}</option>
                    ))
                  }
                </select>
              </div>
              <div className="admin-form-group">
                <label>Orden</label>
                <input 
                  type="number" 
                  name="orden" 
                  defaultValue={menuEditar?.orden || 0}
                  placeholder="0"
                />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn-admin btn-admin-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-admin btn-admin-success">
                  {menuEditar ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionMenus;
