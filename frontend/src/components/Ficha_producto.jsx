import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ContextoCarrito } from '../context/ContextoCarrito';
import './Ficha_producto.css';

function FichaProducto({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { agregarAlCarrito, articulosCarrito } = useContext(ContextoCarrito);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/api/productos/${productId}/`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Error al cargar el producto');
        }
        return response.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [productId]);

  const getStockDisponibleReal = () => {
    if (!product) return 0;
    const enCarrito = articulosCarrito.find(item => item.id === product.idProducto);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    return (product.stock_disponible || 0) - cantidadEnCarrito;
  };

  const handleAddToCart = () => {
    if (product) {
        const stockDisponible = getStockDisponibleReal();
        if (stockDisponible <= 0) return;
        if (quantity > stockDisponible) {
          alert(`Solo hay ${stockDisponible} unidades disponibles`);
          return;
        }
        setIsAdding(true);
        agregarAlCarrito(product, quantity);
        
        // Resetear cantidad a 1 después de agregar
        setQuantity(1);
        
        setTimeout(() => {
            setIsAdding(false);
        }, 2000);
    }
  };

  const toggleZoom = () => {
    setZoomed(!zoomed);
  };

  if (loading) {
    return <div className="ficha-container"><p>Cargando...</p></div>;
  }

  if (!product) {
    return (
      <div className="ficha-container">
        <p>Producto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="ficha-container">
      <div className="ficha-producto">
        <div className="ficha-imagen">
          <img 
            src={product.imagen_url} 
            alt={product.nombre} 
            onClick={toggleZoom} 
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="ficha-info">
          <h1 className="ficha-titulo">{product.nombre}</h1>
          {product.marca && (
            <p>
              <strong>Marca:</strong> <Link to={`/busqueda?q=${encodeURIComponent(product.marca)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.marca}</span></Link>
              {' '}
              <strong>Modelo:</strong> {product.modelo ? <Link to={`/busqueda?q=${encodeURIComponent(product.modelo)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.modelo}</span></Link> : null}
              {' '}
              <strong>Colección:</strong> {product.coleccion ? <Link to={`/coleccion/${encodeURIComponent(product.coleccion_nombre)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.coleccion_nombre}</span></Link> : (product.coleccion_nombre || '')}
            </p>
          )}
          
          <div className="ficha-precio">
            {
              (() => {
                const descuentoPorMostrar = parseFloat(product.descuento_efectivo ?? product.descuento ?? 0) || 0;
                const precioUnit = parseFloat(product.precioUnitario) || 0;
                const precioConDesc = product.precio_con_descuento ? product.precio_con_descuento : (descuentoPorMostrar > 0 ? (precioUnit * (1 - descuentoPorMostrar / 100)).toFixed(2) : precioUnit.toFixed(2));

                if (descuentoPorMostrar > 0) {
                  return (
                    <>
                      <span className="precio-original" style={{textDecoration: 'line-through', color: '#999', fontSize: '1rem', marginRight: '8px'}}>
                        {precioUnit.toFixed(2)} €
                      </span>
                      <span className="precio" style={{color: '#E85B4E'}}>
                        {parseFloat(precioConDesc).toFixed(2)} €
                      </span>
                      <span className="unidad">/ud</span>
                      <span className="descuento-badge" style={{marginLeft: '8px', background: '#E85B4E', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.85rem'}}>
                        -{descuentoPorMostrar.toFixed(0)}%
                      </span>
                    </>
                  );
                }

                return <><span className="precio">{precioUnit.toFixed(2)} €</span><span className="unidad">/ud</span></>;
              })()
            }
          </div>

          <div className="ficha-descripcion">
            <h3>Descripción</h3>
            <p>{product.descripcion}</p>
          </div>

          <div className="ficha-detalles">
            {product.marca && (
              <p><strong>Marca:</strong> <Link to={`/busqueda?q=${encodeURIComponent(product.marca)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.marca}</span></Link></p>
            )}
            {product.modelo && (
              <p><strong>Modelo:</strong> <Link to={`/busqueda?q=${encodeURIComponent(product.modelo)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.modelo}</span></Link></p>
            )}
            {product.color && (
              <p><strong>Color:</strong> <Link to={`/busqueda?q=${encodeURIComponent(product.color)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.color}</span></Link></p>
            )}
            {product.tipo && (
              <p><strong>Tipo:</strong> <Link to={`/busqueda?q=${encodeURIComponent(product.tipo)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.tipo}</span></Link></p>
            )}
            {product.coleccion_nombre && (
              <p><strong>Colección:</strong> {product.coleccion ? <Link to={`/coleccion/${encodeURIComponent(product.coleccion_nombre)}`} className="menu-link" onClick={() => onClose && onClose()}><span className="menu-text-global">{product.coleccion_nombre}</span></Link> : product.coleccion_nombre}</p>
            )}
            <p><strong>Disponibilidad:</strong> 
              {getStockDisponibleReal() > 5 ? (
                <span style={{color: '#4CAF50'}}> En stock ({getStockDisponibleReal()} unidades)</span>
              ) : getStockDisponibleReal() > 0 ? (
                <span style={{color: '#FF9800'}}> Stock limitado ({getStockDisponibleReal()} unidades)</span>
              ) : (
                <span style={{color: '#E85B4E'}}> Sin stock</span>
              )}
            </p>
          </div>

          <div className="ficha-compra">
            <div className="cantidad-selector">
              <label htmlFor="cantidad">Cantidad:</label>
              <div className="cantidad-control">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={getStockDisponibleReal() === 0}
                  aria-label="Reducir cantidad"
                >−</button>
                <input
                  type="number"
                  id="cantidad"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, getStockDisponibleReal())))}
                  min="1"
                  max={getStockDisponibleReal()}
                  disabled={getStockDisponibleReal() === 0}
                  aria-label="Cantidad"
                />
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, getStockDisponibleReal()))}
                  disabled={getStockDisponibleReal() === 0 || quantity >= getStockDisponibleReal()}
                  aria-label="Aumentar cantidad"
                >+</button>
              </div>
            </div>

            <button
              className={`btn-comprar-grande ${isAdding ? 'agregado' : getStockDisponibleReal() === 0 ? 'agotado' : ''}`}
              onClick={handleAddToCart}
              disabled={isAdding}
            >
              {isAdding ? 'Agregado ✓' : (getStockDisponibleReal() === 0 ? 'Sin stock' : 'Añadir al carrito')}
            </button>
          </div>
        </div>
      </div>

      {zoomed && (
        <div className="zoomed-image-modal" onClick={toggleZoom}>
          <img src={product.imagen_url} alt={product.nombre} />
        </div>
      )}
    </div>
  );
}

export default FichaProducto;