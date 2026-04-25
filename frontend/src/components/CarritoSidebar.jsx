import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { ContextoCarrito } from '../context/ContextoCarrito';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import './CarritoSidebar.css';
import './Productos.css';
import './Carrito.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CarritoSidebar({ abierto, onCerrar }) {
  const { articulosCarrito, eliminarDelCarrito, actualizarCantidad, estaAutenticado } = useContext(ContextoCarrito);
  const { user } = usarAutenticacion();
  const navigate = useNavigate();
  const [productosStock, setProductosStock] = useState({});
  const [procesando, setProcesando] = useState(false);

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
    )).then(results => {
      if (!mounted) return;
      setProductosStock(prev => {
        const next = { ...prev };
        results.forEach(r => { next[r.id] = r.stock; });
        return next;
      });
    });

    return () => { mounted = false; };
  }, [articulosCarrito]);

  useEffect(() => {
    if (abierto) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [abierto]);

  const totalItems = articulosCarrito.reduce((sum, item) => sum + item.cantidad, 0);

  const calcularTotal = () =>
    articulosCarrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const calcularTotalSinDescuentos = () =>
    articulosCarrito.reduce((acc, item) => acc + (item.precioOriginal ?? item.precio) * item.cantidad, 0);

  const calcularAhorro = () =>
    articulosCarrito.reduce((acc, item) => {
      const original = item.precioOriginal ?? item.precio;
      return acc + (original - item.precio) * item.cantidad;
    }, 0);

  const hayDescuentos = articulosCarrito.some(item => item.descuentoEfectivo > 0);

  const handleFinalizarCompra = async () => {
    if (!user) {
      onCerrar();
      navigate('/login');
      return;
    }

    setProcesando(true);
    try {
      const token = localStorage.getItem('token');
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
        await stripe.redirectToCheckout({ sessionId: datos.sessionId });
      } else {
        onCerrar();
        navigate('/carrito');
      }
    } catch {
      onCerrar();
      navigate('/carrito');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${abierto ? 'visible' : ''}`}
        onClick={onCerrar}
      />
      <aside className={`carrito-sidebar ${abierto ? 'abierto' : ''}`}>
        <div className="sidebar-header">
          <h2>Tu carrito ({totalItems})</h2>
          <button className="sidebar-cerrar" onClick={onCerrar} aria-label="Cerrar carrito">✕</button>
        </div>

        <div className="sidebar-cuerpo">
          {articulosCarrito.length === 0 ? (
            <div className="sidebar-vacio">
              <p>Tu carrito está vacío</p>
              <button className="btn-anadir btn-sidebar-tienda" onClick={onCerrar}>Seguir comprando</button>
            </div>
          ) : (
            <ul className="sidebar-lista">
              {articulosCarrito.map(item => {
                const descuento = parseFloat(item.descuentoEfectivo ?? 0) || 0;
                const precioOriginal = parseFloat(item.precioOriginal ?? item.precio) || 0;
                const precioFinal = parseFloat(item.precio) || 0;
                const stockTotal = productosStock[item.id] ?? null;
                const stockRestante = stockTotal !== null ? stockTotal - item.cantidad : null;

                const reducir = () => {
                  if ((item.cantidad || 1) <= 1) return;
                  actualizarCantidad({ idProducto: item.id }, item.cantidad - 1);
                };
                const aumentar = () => {
                  if (stockTotal !== null && item.cantidad >= stockTotal) return;
                  actualizarCantidad({ idProducto: item.id }, item.cantidad + 1);
                };
                const eliminar = () => {
                  eliminarDelCarrito({ idProducto: item.id });
                };

                return (
                  <li key={item.id} className="sidebar-item">
                    <img src={item.imagen || '/placeholder.png'} alt={item.nombre} className="sidebar-item-img" />
                    <div className="sidebar-item-info">
                      <div className="sidebar-item-top">
                        <span className="sidebar-item-nombre">{item.nombre}</span>
                        <button className="sidebar-item-eliminar" onClick={eliminar} aria-label="Eliminar">✕</button>
                      </div>
                      {descuento > 0 && (
                        <span className="sidebar-descuento-badge">{descuento.toFixed(0)}% Dto.</span>
                      )}
                      <div className="sidebar-item-precio">
                        {descuento > 0 && (
                          <span className="sidebar-precio-original">{precioOriginal.toFixed(2)} €</span>
                        )}
                        <span className="sidebar-precio-final">{precioFinal.toFixed(2)} €</span>
                      </div>
                      <div className="cantidad-control-card">
                        <button onClick={reducir} disabled={(item.cantidad || 1) <= 1}>−</button>
                        <span>{item.cantidad}</span>
                        <button onClick={aumentar} disabled={stockTotal !== null && item.cantidad >= stockTotal}>+</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {articulosCarrito.length > 0 && (
          <div className="sidebar-footer">
            {!user && (
              <Link to="/login" className="sidebar-registro-banner" onClick={onCerrar}>
                ¿Ya tienes cuenta? <strong>Inicia sesión para guardar tu carrito y continuar con la compra.</strong>
              </Link>
            )}

            <div className="sidebar-totales">
              <div className="sidebar-linea">
                <span>Total estimado</span>
                <span>{calcularTotalSinDescuentos().toFixed(2)} €</span>
              </div>
              {hayDescuentos && (
                <div className="sidebar-linea sidebar-linea-ahorro">
                  <span>Descuentos</span>
                  <span>-{calcularAhorro().toFixed(2)} €</span>
                </div>
              )}
              <div className="sidebar-linea sidebar-linea-total">
                <span>Total con descuentos</span>
                <span>{calcularTotal().toFixed(2)} €</span>
              </div>
              <p className="sidebar-impuestos">Impuestos incluidos y envío calculado al finalizar la compra.</p>
            </div>

            <div className="sidebar-acciones">
              <Link to="/carrito" className="btn-sidebar-ver" onClick={onCerrar}>Ver carrito</Link>
              <button className="btn-anadir btn-sidebar-finalizar" onClick={handleFinalizarCompra} disabled={procesando}>
                {procesando ? 'Redirigiendo...' : 'Finalizar compra'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default CarritoSidebar;
