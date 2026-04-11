import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { ContextoCarrito } from '../context/ContextoCarrito';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import './Pago.css';

// Obtener la clave pública de Stripe
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

const stripePromise = loadStripe(stripePublicKey);

const Pago = () => {
    const { articulosCarrito, vaciarCarrito } = useContext(ContextoCarrito);
    const { user } = usarAutenticacion();
    const navigate = useNavigate();
    
    const [datosEnvio, setDatosEnvio] = useState({
        direccion: '',
        ciudad: '',
        provincia: '',
        codigoPostal: '',
        telefono: ''
    });
    
    const [procesando, setProcesando] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargarDatosCliente = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setCargandoDatos(false);
                    return;
                }

                const respuesta = await fetch('http://localhost:8000/api/auth/user/', {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });

                if (respuesta.ok) {
                    const datos = await respuesta.json();
                    // Los datos del cliente están en datos.cliente
                    setDatosEnvio({
                        direccion: datos.cliente?.direccion || '',
                        ciudad: datos.cliente?.ciudad || '',
                        provincia: datos.cliente?.provincia || '',
                        codigoPostal: datos.cliente?.codigoPostal || '',
                        telefono: datos.cliente?.telefono || ''
                    });
                }
            } catch (err) {
                // Error al cargar datos del cliente
            } finally {
                setCargandoDatos(false);
            }
        };

        cargarDatosCliente();
    }, []);

    const calcularSubtotal = () => {
        const totalConIva = articulosCarrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
        const totalSinIva = totalConIva / 1.21;
        return totalSinIva.toFixed(2);
    };

    const calcularImpuestos = () => {
        return (Number(calcularTotal()) - Number(calcularSubtotal())).toFixed(2);
    };

    const calcularTotal = () => {
        return articulosCarrito.reduce((total, item) => total + item.precio * item.cantidad, 0).toFixed(2);
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;
        setDatosEnvio(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const manejarSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setProcesando(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No estás autenticado. Por favor, inicia sesión.');
                setProcesando(false);
                return;
            }

            // Preparar items para Stripe con toda la información del producto
            const items = articulosCarrito.map(item => ({
                id: item.id,
                nombre: item.nombre,
                descripcion: item.descripcion || '',
                precio: item.precio,
                cantidad: item.cantidad,
                imagen: item.imagen || '',
                marca: item.marca || '',
                modelo: item.modelo || '',
                color: item.color || '',
                tipo: item.tipo || ''
            }));

            // Crear sesión de pago con Stripe
            const respuesta = await fetch('http://localhost:8000/api/crear-sesion-pago/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ 
                    items,
                    direccionEntrega: datosEnvio.direccion,
                    ciudadEntrega: datosEnvio.ciudad,
                    provinciaEntrega: datosEnvio.provincia,
                    codPostalEntrega: datosEnvio.codigoPostal,
                    telefono: datosEnvio.telefono
                })
            });

            if (respuesta.ok) {
                const datos = await respuesta.json();
                
                // Redirigir a Stripe Checkout
                const stripe = await stripePromise;
                
                if (!stripe) {
                    setError('Error al cargar Stripe. Verifica la clave pública.');
                    setProcesando(false);
                    return;
                }
                
                const { error } = await stripe.redirectToCheckout({
                    sessionId: datos.sessionId
                });

                if (error) {
                    setError(error.message);
                }
            } else {
                const datosError = await respuesta.json();
                setError(datosError.detail || 'Error al procesar el pedido.');
            }
        } catch (err) {
            setError('Error de conexión. Por favor, intenta de nuevo.');
        } finally {
            setProcesando(false);
        }
    };

    if (articulosCarrito.length === 0) {
        return (
            <div className="pago-vacio">
                <h2>No hay artículos en tu carrito</h2>
                <p>Agrega productos antes de proceder al pago.</p>
                <button onClick={() => navigate('/')} className="btn-volver">
                    Volver a la tienda
                </button>
            </div>
        );
    }

    if (cargandoDatos) {
        return (
            <div className="pago-cargando">
                <h2>Cargando datos...</h2>
            </div>
        );
    }

    return (
        <div className="pago-container">
            <h1>Finalizar Compra</h1>
            
            <div className="pago-contenido">
                <div className="pago-formulario">
                    <h2>Datos de Envío</h2>
                    {error && <div className="error-mensaje">{error}</div>}
                    
                    <form onSubmit={manejarSubmit}>
                        <div className="form-grupo">
                            <label htmlFor="direccion">Dirección *</label>
                            <input
                                type="text"
                                id="direccion"
                                name="direccion"
                                value={datosEnvio.direccion}
                                onChange={manejarCambio}
                                required
                                placeholder="Calle, número, piso..."
                            />
                        </div>

                        <div className="form-grupo">
                            <label htmlFor="ciudad">Ciudad *</label>
                            <input
                                type="text"
                                id="ciudad"
                                name="ciudad"
                                value={datosEnvio.ciudad}
                                onChange={manejarCambio}
                                required
                                placeholder="Tu ciudad"
                            />
                        </div>

                        <div className="form-fila">
                            <div className="form-grupo">
                                <label htmlFor="provincia">Provincia *</label>
                                <input
                                    type="text"
                                    id="provincia"
                                    name="provincia"
                                    value={datosEnvio.provincia}
                                    onChange={manejarCambio}
                                    required
                                    placeholder="Tu provincia"
                                />
                            </div>

                            <div className="form-grupo">
                                <label htmlFor="codigoPostal">Código Postal *</label>
                                <input
                                    type="text"
                                    id="codigoPostal"
                                    name="codigoPostal"
                                    value={datosEnvio.codigoPostal}
                                    onChange={manejarCambio}
                                    required
                                    placeholder="12345"
                                    maxLength="5"
                                />
                            </div>
                        </div>

                        <div className="form-grupo">
                            <label htmlFor="telefono">Teléfono *</label>
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                value={datosEnvio.telefono}
                                onChange={manejarCambio}
                                required
                                placeholder="123456789"
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn-confirmar-pago"
                            disabled={procesando}
                        >
                            {procesando ? 'Procesando...' : 'Confirmar Pedido'}
                        </button>
                    </form>
                </div>

                <div className="pago-resumen">
                    <h2>Resumen del Pedido</h2>
                    
                    <div className="resumen-items">
                        {articulosCarrito.map((item) => (
                            <div key={item.id} className="resumen-item">
                                <img src={item.imagen} alt={item.nombre} />
                                <div className="resumen-item-info">
                                    <p className="resumen-item-nombre">{item.nombre}</p>
                                    <p className="resumen-item-cantidad">
                                        Cantidad: {item.cantidad}
                                    </p>
                                </div>
                                <p className="resumen-item-precio">
                                    {(item.precio * item.cantidad).toFixed(2)} €
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="resumen-totales">
                        <div className="resumen-linea">
                            <span>Subtotal:</span>
                            <span>{calcularSubtotal()} €</span>
                        </div>
                        <div className="resumen-linea">
                            <span>IVA (21%):</span>
                            <span>{calcularImpuestos()} €</span>
                        </div>
                        <div className="resumen-linea resumen-total">
                            <span>Total:</span>
                            <span>{calcularTotal()} €</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pago;
