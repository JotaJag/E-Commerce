import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { ContextoCarrito } from '../context/ContextoCarrito';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import './Carrito.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const Carrito = () => {
    const { articulosCarrito, vaciarCarrito, actualizarCantidad, eliminarDelCarrito } = useContext(ContextoCarrito);
    const { user } = usarAutenticacion();
    const navigate = useNavigate();

    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);
    const [productosStock, setProductosStock] = useState({});

    useEffect(() => {
        let mounted = true;
        const ids = articulosCarrito.map(a => a.id).filter(Boolean);
        const idsToFetch = ids.filter(id => productosStock[id] === undefined);
        if (idsToFetch.length === 0) return;

        Promise.all(idsToFetch.map(id =>
            fetch(`http://localhost:8000/api/productos/${id}/`)
                .then(res => res.ok ? res.json() : null)
                .then(data => ({ id, stock: data ? (data.stock_disponible ?? data.stock ?? 0) : 0 }))
                .catch(() => ({ id, stock: 0 }))
        ))
        .then(results => {
            if (!mounted) return;
            setProductosStock(prev => {
                const next = { ...prev };
                results.forEach(r => { next[r.id] = r.stock; });
                return next;
            });
        });

        return () => { mounted = false; };
    }, [articulosCarrito]);

    const calcularTotalSinDescuentos = () =>
        articulosCarrito.reduce((acc, item) => acc + (item.precioOriginal ?? item.precio) * item.cantidad, 0);

    const calcularAhorro = () =>
        articulosCarrito.reduce((acc, item) => {
            const original = item.precioOriginal ?? item.precio;
            return acc + (original - item.precio) * item.cantidad;
        }, 0);

    const calcularTotal = () =>
        articulosCarrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

    const calcularBaseImponible = () => (calcularTotal() / 1.21).toFixed(2);
    const calcularIva = () => (calcularTotal() - calcularTotal() / 1.21).toFixed(2);

    const hayDescuentos = () => articulosCarrito.some(item => item.descuentoEfectivo > 0);

    const manejarPago = async () => {
        setError(null);
        setProcesando(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No estás autenticado. Por favor, inicia sesión.');
                setProcesando(false);
                return;
            }

            const items = articulosCarrito.map(item => ({
                id: item.id,
                nombre: item.nombre,
                descripcion: item.descripcion || '',
                precio: item.precio,
                precioOriginal: item.precioOriginal ?? item.precio,
                descuentoEfectivo: item.descuentoEfectivo ?? 0,
                cantidad: item.cantidad,
                imagen: item.imagen || '',
                marca: item.marca || '',
                modelo: item.modelo || '',
                color: item.color || '',
                tipo: item.tipo || '',
            }));

            const respuesta = await fetch('http://localhost:8000/api/crear-sesion-pago/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify({ items }),
            });

            if (respuesta.ok) {
                const datos = await respuesta.json();
                const stripe = await stripePromise;
                if (!stripe) {
                    setError('Error al cargar Stripe. Verifica la clave pública.');
                    setProcesando(false);
                    return;
                }
                const { error } = await stripe.redirectToCheckout({ sessionId: datos.sessionId });
                if (error) setError(error.message);
            } else {
                const datosError = await respuesta.json();
                setError(datosError.error || datosError.detail || 'Error al procesar el pedido.');
            }
        } catch {
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
                <button onClick={() => navigate('/')} className="btn-volver">Volver a la tienda</button>
            </div>
        );
    }

    return (
        <div className="pago-container">
            <h1>Mi carrito</h1>

            <div className="pago-contenido">
                {/* Información sobre el proceso */}
                <div className="pago-formulario">
                    <h2>Resumen y pago</h2>
                    {error && <div className="error-mensaje">{error}</div>}

                    <div className="carrito-items">
                        {articulosCarrito.map(item => {
                            const precioUnit = parseFloat(item.precio) || 0;
                            const descuento = parseFloat(item.descuentoEfectivo ?? 0) || 0;
                            const subtotal = (precioUnit * (item.cantidad || 1));

                            const stockDisponible = (productosStock[item.id] !== undefined) ? productosStock[item.id] : null;

                            const aumentar = () => {
                                const nuevo = (item.cantidad || 1) + 1;
                                if (stockDisponible !== null && nuevo > stockDisponible) {
                                    alert(`Solo hay ${stockDisponible} unidades disponibles de ${item.nombre}`);
                                    return;
                                }
                                actualizarCantidad({ idProducto: item.id }, nuevo);
                            };
                            const reducir = () => {
                                const actual = item.cantidad || 1;
                                if (actual <= 1) return;
                                actualizarCantidad({ idProducto: item.id }, actual - 1);
                            };
                            const eliminar = () => {
                                eliminarDelCarrito({ idProducto: item.id });
                            };

                            return (
                                <div key={item.id} className="carrito-item" style={{display: 'flex', alignItems: 'center'}}>
                                    <img src={item.imagen || '/placeholder.png'} alt={item.nombre} className="carrito-item-imagen" />
                                    <div className="carrito-item-details">
                                        <h3>{item.nombre}</h3>
                                        {descuento > 0 ? (
                                            <p>
                                                <span style={{textDecoration: 'line-through', color: '#999', marginRight: '6px'}}>{(item.precioOriginal ?? item.precio).toFixed(2)} €</span>
                                                <span style={{color: '#E85B4E', fontWeight: 'bold'}}>{precioUnit.toFixed(2)} €</span>
                                                <span style={{marginLeft: '6px', background: '#E85B4E', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem'}}>-{descuento.toFixed(0)}%</span>
                                            </p>
                                        ) : (
                                            <p>Precio: {precioUnit.toFixed(2)} €</p>
                                        )}

                                        {stockDisponible !== null && (
                                            (() => {
                                                const stockInsuficiente = item.cantidad > stockDisponible;
                                                if (stockInsuficiente) {
                                                    return (
                                                        <p style={{color: '#E85B4E', fontSize: '0.9rem', fontWeight: 'bold'}}>
                                                            ⚠️ Solo quedan {stockDisponible} unidades disponibles
                                                        </p>
                                                    );
                                                }
                                                if (stockDisponible > 0 && stockDisponible <= 5) {
                                                    return (
                                                        <p style={{color: '#FF9800', fontSize: '0.9rem'}}>
                                                            Solo quedan {stockDisponible} unidades
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })()
                                        )}
                                    </div>
                                    <div className="carrito-item-actions" style={{marginLeft: 'auto'}}>
                                        <div className="cantidad-control">
                                            <button onClick={reducir} disabled={(item.cantidad || 1) <= 1}>-</button>
                                            <span>{item.cantidad}</span>
                                            <button onClick={aumentar} disabled={stockDisponible !== null && (item.cantidad || 1) >= stockDisponible}>+</button>
                                        </div>
                                        <button onClick={eliminar} className="btn-eliminar">Eliminar</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className="btn-confirmar-pago"
                        onClick={manejarPago}
                        disabled={procesando}
                    >
                        {procesando ? 'Redirigiendo a Stripe...' : 'Ir a pagar →'}
                    </button>

                    <p className="pago-seguro-nota">
                        🔒 Pago 100% seguro procesado por Stripe. No almacenamos datos de tu tarjeta.
                    </p>
                </div>

                {/* Resumen del pedido */}
                <div className="pago-resumen">
                    <h2>Resumen del Pedido</h2>

                    <div className="resumen-items">
                        {articulosCarrito.map((item) => (
                            <div key={item.id} className="resumen-item">
                                <img src={item.imagen} alt={item.nombre} />
                                <div className="resumen-item-info">
                                    <p className="resumen-item-nombre">{item.nombre}</p>
                                    <p className="resumen-item-cantidad">Cantidad: {item.cantidad}</p>
                                    {item.descuentoEfectivo > 0 && (
                                        <p style={{ fontSize: '0.8rem', color: '#E85B4E' }}>
                                            -{item.descuentoEfectivo.toFixed(0)}% descuento aplicado
                                        </p>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {item.descuentoEfectivo > 0 && (
                                        <p style={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem', margin: 0 }}>
                                            {((item.precioOriginal ?? item.precio) * item.cantidad).toFixed(2)} €
                                        </p>
                                    )}
                                    <p className="resumen-item-precio" style={{ margin: 0 }}>
                                        {(item.precio * item.cantidad).toFixed(2)} €
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="resumen-totales">
                        {hayDescuentos() && (
                            <>
                                <div className="resumen-linea" style={{ color: '#999' }}>
                                    <span>Precio sin descuentos:</span>
                                    <span>{calcularTotalSinDescuentos().toFixed(2)} €</span>
                                </div>
                                <div className="resumen-linea" style={{ color: '#E85B4E', fontWeight: 'bold' }}>
                                    <span>Ahorro total:</span>
                                    <span>-{calcularAhorro().toFixed(2)} €</span>
                                </div>
                            </>
                        )}
                        <div className="resumen-linea">
                            <span>Base imponible:</span>
                            <span>{calcularBaseImponible()} €</span>
                        </div>
                        <div className="resumen-linea">
                            <span>IVA (21%):</span>
                            <span>{calcularIva()} €</span>
                        </div>
                        <div className="resumen-linea resumen-total">
                            <span>Total:</span>
                            <span>{calcularTotal().toFixed(2)} €</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Carrito;
