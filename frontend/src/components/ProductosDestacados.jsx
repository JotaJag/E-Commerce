import { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ContextoCarrito } from '../context/ContextoCarrito';
import Modal from './Modal';
import FichaProducto from './Ficha_producto';
import './Productos.css';
import './Modal.css';

function ProductosDestacados() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { agregarAlCarrito, articulosCarrito } = useContext(ContextoCarrito);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);
  const LIMITE_PRODUCTOS = 12;

  const onMouseDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.pageX;
    scrollStartLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    const delta = e.pageX - dragStartX.current;
    scrollRef.current.scrollLeft = scrollStartLeft.current - delta;
  };

  const hasDragged = useRef(false);

  const onMouseUp = (e) => {
    hasDragged.current = Math.abs(e.pageX - dragStartX.current) > 5;
    isDragging.current = false;
    scrollRef.current.style.cursor = 'grab';
    scrollRef.current.style.userSelect = '';
  };

  useEffect(() => {
    return () => {
      setSelectedProduct(null);
    };
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/productos/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Hay problemas para cargar los productos.');
        }
        return response.json();
      })
      .then(data => {
        const productList = Array.isArray(data) ? data : (data.results || []);
        setProducts(productList);
      })
      .catch(error => {
      });
  }, []);

  const getStockDisponibleReal = (product) => {
    const enCarrito = articulosCarrito.find(item => item.id === product.idProducto);
    const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;
    return (product.stock_disponible || 0) - cantidadEnCarrito;
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const product = products.find(p => p.idProducto === productId);
    const maxStock = getStockDisponibleReal(product);
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(newQuantity, maxStock)),
    }));
  };

  const handleAddToCart = (product) => {
    const stockDisponible = getStockDisponibleReal(product);
    if (stockDisponible <= 0) return;
    const quantity = quantities[product.idProducto] || 1;
    if (quantity > stockDisponible) {
      alert(`Solo hay ${stockDisponible} unidades disponibles`);
      return;
    }
    setAddingProductId(product.idProducto);
    agregarAlCarrito(product, quantity);
    
    setQuantities(prev => ({
      ...prev,
      [product.idProducto]: 1
    }));
    
    setTimeout(() => {
      setAddingProductId(null);
    }, 2000);
  };

  const handleImageClick = (e, product) => {
    e.stopPropagation();
    if (hasDragged.current) return;
    if (e.target.tagName === 'IMG' || e.currentTarget.classList.contains('product-image-container')) {
      setSelectedProduct(product);
    }
  };

  const productosActivos = products.filter(product => product.estado).slice(0, 18);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.product-card');
      const amount = card ? card.offsetWidth + 18 : 300;
      scrollRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }
  };


  if (productosActivos.length === 0) {
    return null;
  }

  return (
    <section className="productos-section" onClick={(e) => e.stopPropagation()}>
      <div className="colecciones-header" style={{marginBottom: '2rem'}}>
        <div className="colecciones-header-titles">
          <h1 className="titulo-bloque">Nuestra selección de productos</h1>
          <h2 className="subtitulo-bloque">El mejor surtido de la mejor calidad</h2>
        </div>

          <Link to="/productos" className="colecciones-ver-todas">
            Ver todos →
          </Link>

      </div>
      
      <div className="carousel-wrapper">
        <button className="carousel-btn carousel-btn-left" onClick={() => scroll(-1)}>&#8249;</button>
        <div
          className="product-list scrollable"
          ref={scrollRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: 'grab', touchAction: 'pan-x' }}
        >
        {productosActivos.map(product => {
          const isAdding = addingProductId === product.idProducto;
          const stockDisponible = getStockDisponibleReal(product);
          return (
            <div key={product.idProducto} className="product-card">
              <div onClick={(e) => handleImageClick(e, product)} className="product-image-container" style={{cursor: 'pointer'}}>
                <img src={product.imagen_url} alt={product.nombre} />
              </div>
              <div className="product-info">
                <h2>{product.nombre}</h2>
                {
                  (() => {
                    const descuentoPorMostrar = parseFloat(product.descuento_efectivo ?? product.descuento ?? 0) || 0;
                    const precioUnit = parseFloat(product.precioUnitario) || 0;
                    const precioConDesc = product.precio_con_descuento ? product.precio_con_descuento : (descuentoPorMostrar > 0 ? (precioUnit * (1 - descuentoPorMostrar / 100)).toFixed(2) : precioUnit.toFixed(2));

                    if (descuentoPorMostrar > 0) {
                      return (
                        <p className="product-price">
                          <span style={{textDecoration: 'line-through', color: '#999', fontSize: '0.9rem', marginRight: '6px'}}>
                            {precioUnit.toFixed(2)} €
                          </span>
                          <span style={{color: '#E85B4E', fontWeight: 'bold'}}>{parseFloat(precioConDesc).toFixed(2)} €</span>
                          <span style={{marginLeft: '6px', background: '#E85B4E', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem'}}>
                            -{descuentoPorMostrar.toFixed(0)}%
                          </span>
                        </p>
                      );
                    }

                    return <p className="product-price">{precioUnit.toFixed(2)} €</p>;
                  })()
                }
                {stockDisponible <= 5 && stockDisponible > 0 && (
                  <p className="stock-warning">¡Solo quedan {stockDisponible} unidades!</p>
                )}
                {stockDisponible === 0 && (
                  <p className="stock-agotado">Sin stock</p>
                )}
                <div className="product-card-controls">
                  <div className="cantidad-control-card">
                    <button 
                      onClick={() => handleQuantityChange(product.idProducto, (quantities[product.idProducto] || 1) - 1)}
                      disabled={stockDisponible === 0}
                    >−</button>
                    <span>{quantities[product.idProducto] || 1}</span>
                    <button 
                      onClick={() => handleQuantityChange(product.idProducto, (quantities[product.idProducto] || 1) + 1)}
                      disabled={stockDisponible === 0 || (quantities[product.idProducto] || 1) >= stockDisponible}
                    >+</button>
                  </div>
                  <button
                    className={`btn-anadir ${isAdding ? 'agregado' : stockDisponible === 0 ? 'agotado' : ''}`}
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdding}
                  >
                    {isAdding ? 'Agregado ✓' : (stockDisponible === 0 ? 'Agotado' : 'Comprar')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
        <button className="carousel-btn carousel-btn-right" onClick={() => scroll(1)}>&#8250;</button>
      </div>

      {selectedProduct && selectedProduct.idProducto && (
        <Modal onClose={() => setSelectedProduct(null)}>
          <FichaProducto productId={selectedProduct.idProducto} />
        </Modal>
      )}
    </section>
  );
}

export default ProductosDestacados;
