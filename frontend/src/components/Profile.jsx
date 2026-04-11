import React, { useState, useEffect, useContext } from 'react';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import { ContextoCarrito } from '../context/ContextoCarrito';
import FichaProducto from './Ficha_producto';
import Modal from './Modal';
import './Auth.css';
import './Profile.css';

const Profile = () => {
    const { handleLogout } = usarAutenticacion();
    const { logout: cartLogout } = useContext(ContextoCarrito);
    const [profile, setProfile] = useState({
        email: '',
        first_name: '',
        last_name: '',
        provincia: '',
        ciudad: '',
        codigoPostal: '',
        telefono: '',
        direccion: '',
        codigoCuenta: '',
        fechaRegistro: ''
    });
    const [pedidos, setPedidos] = useState([]);
    const [vistaActual, setVistaActual] = useState('perfil'); // 'perfil' o 'pedidos'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No estás autenticado.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/auth/profile/', {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    const profileData = {};
                    for (const key in data) {
                        profileData[key] = data[key] === null ? '' : data[key];
                    }
                    setProfile(profileData);
                } else {
                    setError('No se pudo cargar el perfil.');
                }
            } catch (err) {
                setError('Ha ocurrido un error al contactar con el servidor.');
            } finally {
                setLoading(false);
            }
        };

        const fetchPedidos = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch('http://localhost:8000/api/pedidos/mis_pedidos/', {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPedidos(data);
                }
            } catch (err) {
            }
        };

        fetchProfile();
        fetchPedidos();
    }, []);

    const abrirModalProducto = (productoId) => {
        setProductoSeleccionado(productoId);
        setModalProductoAbierto(true);
    };

    const cerrarModalProducto = () => {
        setModalProductoAbierto(false);
        setProductoSeleccionado(null);
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/auth/change-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(passwordData)
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordSuccess(data.message);
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });
                setMostrarCambioPassword(false);
                setTimeout(() => setPasswordSuccess(''), 3000);
            } else {
                setPasswordError(data.error || 'Error al cambiar la contraseña');
            }
        } catch (err) {
            setPasswordError('Error de conexión con el servidor');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({
            ...prevProfile,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const token = localStorage.getItem('token');
        if (!token) {
            setError('No estás autenticado.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/auth/profile/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                const data = await response.json();
                setProfile(data);
                setSuccess('¡Perfil actualizado con éxito!');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'No se pudo actualizar el perfil.');
            }
        } catch (err) {
            setError('Ha ocurrido un error al contactar con el servidor.');
        }
    };

    if (loading) {
        return <p>Cargando perfil...</p>;
    }

    return (
        <div className="form-container profile-container">
            <div className="profile-tabs">
                <button 
                    className={`tab-button ${vistaActual === 'perfil' ? 'active' : ''}`}
                    onClick={() => setVistaActual('perfil')}
                >
                    Mi Perfil
                </button>
                <button 
                    className={`tab-button ${vistaActual === 'pedidos' ? 'active' : ''}`}
                    onClick={() => setVistaActual('pedidos')}
                >
                    Mis Pedidos ({pedidos.length})
                </button>
            </div>

            {vistaActual === 'perfil' ? (
                <div className="form-box large">
                    <h2>Tu Perfil</h2>
                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                    <form onSubmit={handleSubmit}>
                        <div className="profile-form-grid">
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" name="email" value={profile.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input type="text" name="telefono" value={profile.telefono} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Nombre</label>
                                <input type="text" name="first_name" value={profile.first_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Apellidos</label>
                                <input type="text" name="last_name" value={profile.last_name} onChange={handleChange} required />
                            </div>
                            <div className="form-group form-group-full">
                                <label>Dirección</label>
                                <input type="text" name="direccion" value={profile.direccion} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Ciudad</label>
                                <input type="text" name="ciudad" value={profile.ciudad} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Provincia</label>
                                <input type="text" name="provincia" value={profile.provincia} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Código Postal</label>
                                <input type="text" name="codigoPostal" value={profile.codigoPostal} onChange={handleChange} maxLength="5" required />
                            </div>
                            <div className="form-group readonly">
                                <label>Código de Cuenta</label>
                                <input type="text" name="codigoCuenta" value={profile.codigoCuenta} readOnly />
                            </div>
                            <div className="form-group readonly form-group-full">
                                <label>Fecha de Registro</label>
                                <input 
                                    type="text" 
                                    name="fechaRegistro" 
                                    value={profile.fechaRegistro ? new Date(profile.fechaRegistro).toLocaleDateString('es-ES') : ''} 
                                    readOnly 
                                />
                            </div>
                        </div>
                        <div className="form-buttons-container">
                            <button type="submit" className="form-button">Actualizar Perfil</button>
                            <button type="button" className="form-button logout" onClick={() => {
                                handleLogout();
                                cartLogout();
                            }}>Cerrar sesión</button>
                        </div>
                    </form>

                    {/* Sección de cambio de contraseña */}
                    <div className="password-section">
                        <div className="password-header">
                            <h3>Cambiar Contraseña</h3>
                            <button 
                                type="button" 
                                className="btn-toggle-password"
                                onClick={() => setMostrarCambioPassword(!mostrarCambioPassword)}
                            >
                                {mostrarCambioPassword ? 'Cancelar' : 'Cambiar Contraseña'}
                            </button>
                        </div>

                        {mostrarCambioPassword && (
                            <form onSubmit={handlePasswordSubmit} className="password-form">
                                {passwordError && <p className="error-message">{passwordError}</p>}
                                {passwordSuccess && <p className="success-message">{passwordSuccess}</p>}
                                
                                <div className="profile-form-grid">
                                    <div className="form-group form-group-full">
                                        <label>Contraseña Actual</label>
                                        <input 
                                            type="password" 
                                            name="current_password" 
                                            value={passwordData.current_password} 
                                            onChange={handlePasswordChange} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Nueva Contraseña</label>
                                        <input 
                                            type="password" 
                                            name="new_password" 
                                            value={passwordData.new_password} 
                                            onChange={handlePasswordChange} 
                                            required 
                                            minLength="8"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirmar Nueva Contraseña</label>
                                        <input 
                                            type="password" 
                                            name="confirm_password" 
                                            value={passwordData.confirm_password} 
                                            onChange={handlePasswordChange} 
                                            required 
                                            minLength="8"
                                        />
                                    </div>
                                </div>
                                
                                <div className="form-buttons-container">
                                    <button type="submit" className="form-button">Guardar Nueva Contraseña</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            ) : (
                <div className="pedidos-container">
                    <h2>Mis Pedidos</h2>
                    {pedidos.length === 0 ? (
                        <p className="no-pedidos">No tienes pedidos aún.</p>
                    ) : (
                        <div className="pedidos-lista">
                            {pedidos.map(pedido => (
                                <div key={pedido.idPedido} className="pedido-card">
                                    <div className="pedido-header">
                                        <h3>Pedido #{pedido.idPedido}</h3>
                                        <div className="badges-container">
                                            <span className={`estado-badge estado-${pedido.estado}`}>
                                                {pedido.estado_display}
                                            </span>
                                            <span className={`estado-badge ${pedido.pagado ? 'pagado' : 'pendiente-pago'}`}>
                                                {pedido.pagado ? '✓ Pagado' : 'Pendiente Pago'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pedido-info">
                                        <p><strong>Fecha:</strong> {new Date(pedido.fechaPedido).toLocaleDateString('es-ES')}</p>
                                        <p><strong>Dirección:</strong> {pedido.direccionEntrega}, {pedido.ciudadEntrega}</p>
                                        <p><strong>Total:</strong> €{pedido.total}</p>
                                    </div>
                                    <div className="pedido-productos">
                                        <h4>Productos:</h4>
                                        {pedido.lineas.map(linea => (
                                            <div 
                                                key={linea.id} 
                                                className="pedido-producto"
                                                onClick={() => abrirModalProducto(linea.producto_id)}
                                            >
                                                {linea.producto_imagen && (
                                                    <img src={linea.producto_imagen} alt={linea.producto_nombre} />
                                                )}
                                                <div className="producto-info">
                                                    <p className="producto-nombre">{linea.producto_nombre}</p>
                                                    <p className="producto-cantidad">Cantidad: {linea.cantidad}</p>
                                                    <p className="producto-precio">€{linea.precio_congelado} x {linea.cantidad} = €{linea.subtotal}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {modalProductoAbierto && (
                <Modal isOpen={modalProductoAbierto} onClose={cerrarModalProducto}>
                    <FichaProducto productId={productoSeleccionado} />
                </Modal>
            )}
        </div>
    );
};

export default Profile;
