import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ContextoCarrito } from '../context/ContextoCarrito';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import './Carrito.css';

const Carrito = () => {
    const { articulosCarrito, eliminarDelCarrito, actualizarCantidad, vaciarCarrito } = useContext(ContextoCarrito);
    const { user } = usarAutenticacion();
    const navigate = useNavigate();
    const [productosStock, setProductosStock] = useState({});

    useEffect(() => {
        // Cargar stock disponible de los productos en el carrito
        const cargarStock = async () => {
            const stockMap = {};
            for (const item of articulosCarrito) {
                try {
                    const response = await fetch(`http://localhost:8000/api/productos/${item.id}/`);
                    if (response.ok) {
                        const producto = await response.json();
                        stockMap[item.id] = producto.stock_disponible || 0;
                    }
                } catch (error) {
                }
            }
            setProductosStock(stockMap);
        };

        if (articulosCarrito.length > 0) {
            cargarStock();
        }
    }, [articulosCarrito]);

    const handleActualizarCantidad = (item, nuevaCantidad) => {
        const stockDisponible = productosStock[item.id] || 0;
        
        if (nuevaCantidad > stockDisponible) {
            alert(`Solo hay ${stockDisponible} unidades disponibles de ${item.nombre}`);
            return;
        }
        
        actualizarCantidad({ idProducto: item.id }, nuevaCantidad);
    };

    const calculateTotal = () => {
        return articulosCarrito.reduce((total, item) => total + item.precio * item.cantidad, 0).toFixed(2);
    };

    const calculateSubTotal = () => {
        const totalConIva = articulosCarrito.reduce((total, item) => total + item.precio * item.cantidad, 0);
        const totalSinIva = totalConIva / 1.21;
        return totalSinIva.toFixed(2);
    };

    const calculateTax = () => {
        return (Number(calculateTotal()) - Number(calculateSubTotal())).toFixed(2);
    };

    const handleProcederPago = () => {
        if (user) {
            navigate('/pago');
        } else {
            navigate('/login');
        }
    };

    if (articulosCarrito.length === 0) {
        return (
            <div className="carrito-vacio">
                <h2>Tu Carrito de Compras</h2>
                <p>Tu carrito está vacío.</p>
                <Link to="/" className="btn-volver-tienda">Volver a la tienda</Link>
            </div>
        );
    }

    return (
        <div className="carrito-container">
            <h2>Carrito de Compras</h2>
            <div className="carrito-contenido">
                <div className="carrito-items">
                    {articulosCarrito.map((item) => {
                        const stockDisponible = productosStock[item.id] || 0;
                        const stockInsuficiente = item.cantidad > stockDisponible;
                        
                        return (
                            <div key={item.id} className="carrito-item">
                                <img src={item.imagen || '/placeholder.png'} alt={item.nombre} className="carrito-item-imagen" />
                                <div className="carrito-item-details">
                                    <h3>{item.nombre}</h3>
                                    <p>Precio: {item.precio.toFixed(2)} €</p>
                                    {stockInsuficiente && (
                                        <p style={{color: '#E85B4E', fontSize: '0.9rem', fontWeight: 'bold'}}>
                                            ⚠️ Solo quedan {stockDisponible} unidades disponibles
                                        </p>
                                    )}
                                    {stockDisponible > 0 && !stockInsuficiente && stockDisponible <= 5 && (
                                        <p style={{color: '#FF9800', fontSize: '0.9rem'}}>
                                            Solo quedan {stockDisponible} unidades
                                        </p>
                                    )}
                                </div>
                                <div className="carrito-item-actions">
                                    <div className="cantidad-control">
                                        <button 
                                            onClick={() => handleActualizarCantidad(item, item.cantidad - 1)} 
                                            disabled={item.cantidad === 1}
                                        >
                                            -
                                        </button>
                                        <span>{item.cantidad}</span>
                                        <button 
                                            onClick={() => handleActualizarCantidad(item, item.cantidad + 1)}
                                            disabled={item.cantidad >= stockDisponible}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button onClick={() => eliminarDelCarrito({ idProducto: item.id })} className="btn-eliminar">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="carrito-resumen">
                <h3>Resumen del Pedido</h3>
                <div className="resumen-linea">
                    <span>Subtotal: </span>
                    <span>{calculateSubTotal()} €</span>
                </div>
                <div className="resumen-linea">
                    <span>Impuestos: </span>
                    <span>{calculateTax()} €</span>
                </div>
                <div className="resumen-total">
                    <span>Total: </span>
                    <span>{calculateTotal()} €</span>
                </div>
                <button onClick={handleProcederPago} className="btn-comprar">
                    Proceder al Pago
                </button>
                <button onClick={vaciarCarrito} className="btn-vaciar">Vaciar Carrito</button>
            </div>
        </div>
    );
};

export default Carrito;
