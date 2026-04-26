import { useState, useEffect, Fragment } from 'react';

function GestionBanners() {
  const [banners, setBanners] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [colecciones, setColecciones] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [bannerEditar, setBannerEditar] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    imagen: null,
    enlace: '',
    tipoEnlace: 'categoria', // categoria, coleccion, personalizado
    categoria_id: '',
    coleccion_id: '',
    estado: true,
    orden: 0
  });

  useEffect(() => {
    cargarBanners();
    cargarCategorias();
    cargarColecciones();
  }, []);

  const cargarBanners = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/banners/');
      const data = await response.json();
      setBanners(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      alert('Error al cargar los banners');
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/categorias/');
      const data = await response.json();
      const categoriasLista = Array.isArray(data) ? data : data.results || [];
      setCategorias(categoriasLista);
    } catch (error) {
      alert('Error al cargar las categorías');
    }
  };

  const cargarColecciones = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/colecciones/');
      const data = await response.json();
      setColecciones(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      alert('Error al cargar las colecciones');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTipoEnlaceChange = (e) => {
    const tipo = e.target.value;
    setFormData(prev => ({
      ...prev,
      tipoEnlace: tipo,
      enlace: '',
      categoria_id: '',
      coleccion_id: ''
    }));
  };

  const generarEnlace = () => {
    switch (formData.tipoEnlace) {
      case 'categoria':
        return formData.categoria_id ? `/categoria/${formData.categoria_id}` : '';
      case 'coleccion':
        return formData.coleccion_id ? `/coleccion/${formData.coleccion_id}` : '';
      case 'personalizado':
        return formData.enlace;
      default:
        return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const enlaceFinal = generarEnlace();

    if (!enlaceFinal && formData.tipoEnlace !== 'personalizado') {
      alert('Por favor selecciona una categoría o colección');
      return;
    }

    const data = new FormData();
    if (bannerEditar) {
      data.append('idBanner', bannerEditar.idBanner);
    }
    data.append('titulo', formData.titulo);
    data.append('descripcion', formData.descripcion);
    data.append('enlace', enlaceFinal);
    data.append('estado', formData.estado);
    data.append('orden', formData.orden);
    
    if (formData.imagen instanceof File) {
      data.append('imagen', formData.imagen);
    }

    try {
      const url = bannerEditar
        ? `http://localhost:8000/api/banners/${bannerEditar.idBanner}/`
        : 'http://localhost:8000/api/banners/';
      
      const response = await fetch(url, {
        method: bannerEditar ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: data
      });

      if (response.ok) {
        alert(bannerEditar ? 'Banner actualizado correctamente' : 'Banner creado correctamente');
        resetForm();
        setModalAbierto(false);
        cargarBanners();
      } else {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        alert('Error al guardar el banner: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      alert('Error al guardar el banner');
    }
  };

  const handleEditar = (banner) => {
    setBannerEditar(banner);
    setModalAbierto(true);
    
    // Determinar el tipo de enlace
    let tipoEnlace = 'personalizado';
    let categoria_id = '';
    let coleccion_id = '';
    
    if (banner.enlace && banner.enlace.startsWith('/categoria/')) {
      tipoEnlace = 'categoria';
      categoria_id = banner.enlace.split('/categoria/')[1];
    } else if (banner.enlace && banner.enlace.startsWith('/coleccion/')) {
      tipoEnlace = 'coleccion';
      coleccion_id = banner.enlace.split('/coleccion/')[1];
    }
    
    setFormData({
      titulo: banner.titulo || '',
      descripcion: banner.descripcion || '',
      imagen: null,
      enlace: tipoEnlace === 'personalizado' ? (banner.enlace || '') : '',
      tipoEnlace: tipoEnlace,
      categoria_id: categoria_id,
      coleccion_id: coleccion_id,
      estado: banner.estado ?? true,
      orden: banner.orden || 0
    });
  };

  const handleEliminar = async (idBanner) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este banner?')) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8000/api/banners/${idBanner}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        alert('Banner eliminado correctamente');
        cargarBanners();
      } else {
        alert('Error al eliminar el banner');
      }
    } catch (error) {
      alert('Error al eliminar el banner');
    }
  };

  const resetForm = () => {
    setBannerEditar(null);
    setFormData({
      titulo: '',
      descripcion: '',
      imagen: null,
      enlace: '',
      tipoEnlace: 'categoria',
      categoria_id: '',
      coleccion_id: '',
      estado: true,
      orden: 0
    });
  };

  const renderCategoriasJerarquicas = () => {
    const categoriasPadre = categorias.filter(cat => !cat.padre);
    
    return categoriasPadre.map(padre => (
      <Fragment key={padre.id}>
        <option value={padre.id}>{padre.nombre}</option>
        {categorias
          .filter(cat => cat.padre === padre.id)
          .map(hijo => (
            <option key={hijo.id} value={hijo.id}>
              → {hijo.nombre}
            </option>
          ))}
      </Fragment>
    ));
  };

  return (
    <div className="admin-section">
      <h2>Gestión de Banners</h2>
      
      <div className="admin-actions">
        <button className="btn-admin btn-admin-primary" onClick={() => {
          setBannerEditar(null);
          setModalAbierto(true);
        }}>
          Nuevo Banner
        </button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Orden</th>
            <th>Título</th>
            <th>Descripción</th>
            <th>Enlace</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {banners.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                No hay banners registrados
              </td>
            </tr>
          ) : (
            [...banners].sort((a, b) => (a.idBanner || a.id) - (b.idBanner || b.id)).map(banner => (
              <tr key={banner.idBanner}>
                <td>{banner.orden}</td>
                <td>{banner.titulo}</td>
                <td>{banner.descripcion}</td>
                <td>{banner.enlace}</td>
                <td>
                  <span className={`admin-badge ${banner.estado ? 'badge-activo' : 'badge-inactivo'}`}>
                    {banner.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="table-actions">
                  <button
                    onClick={() => handleEditar(banner)}
                    className="btn-admin btn-admin-secondary"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(banner.idBanner)}
                    className="btn-admin btn-admin-danger"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <div className="admin-modal">
          <div className="admin-modal-content">
            <div className="admin-modal-header">
              <h3>{bannerEditar ? 'Editar Banner' : 'Nuevo Banner'}</h3>
              <button className="admin-modal-close" onClick={() => {
                setModalAbierto(false);
                setBannerEditar(null);
                resetForm();
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="admin-form-group">
                  <label>Título *</label>
                  <input
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Orden</label>
                  <input
                    type="number"
                    name="orden"
                    value={formData.orden}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Descripción *</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  required
                  rows="3"
                />
              </div>

              <div className="admin-form-group">
                <label>Imagen {bannerEditar ? '(dejar vacío para mantener la actual)' : '*'}</label>
                <input
                  type="file"
                  name="imagen"
                  accept="image/*"
                  onChange={handleInputChange}
                  required={!bannerEditar}
                />
              </div>

              <div className="form-row">
                <div className="admin-form-group">
                  <label>Tipo de Enlace *</label>
                  <select
                    name="tipoEnlace"
                    value={formData.tipoEnlace}
                    onChange={handleTipoEnlaceChange}
                    required
                  >
                    <option value="categoria">Categoría</option>
                    <option value="coleccion">Colección</option>
                    <option value="personalizado">URL Personalizada</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="estado"
                      checked={formData.estado}
                      onChange={handleInputChange}
                    />
                    {' '}Activo
                  </label>
                </div>
              </div>

              {formData.tipoEnlace === 'categoria' && (
                <div className="admin-form-group">
                  <label>Categoría *</label>
                  <select
                    name="categoria_id"
                    value={formData.categoria_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {renderCategoriasJerarquicas()}
                  </select>
                </div>
              )}

              {formData.tipoEnlace === 'coleccion' && (
                <div className="admin-form-group">
                  <label>Colección *</label>
                  <select
                    name="coleccion_id"
                    value={formData.coleccion_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar colección</option>
                    {colecciones.map(col => (
                      <option key={col.id} value={col.id}>{col.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.tipoEnlace === 'personalizado' && (
                <div className="admin-form-group">
                  <label>URL Personalizada *</label>
                  <input
                    type="text"
                    name="enlace"
                    value={formData.enlace}
                    onChange={handleInputChange}
                    placeholder="/productos, /acerca-de-nosotros, https://..."
                    required
                  />
                </div>
              )}

              <div className="admin-form-actions">
                <button type="submit" className="btn-admin btn-admin-primary">
                  {bannerEditar ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => {
                  setModalAbierto(false);
                  setBannerEditar(null);
                  resetForm();
                }} className="btn-admin btn-admin-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionBanners;
