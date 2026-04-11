import { useState, useEffect, useContext } from 'react';
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
  const LIMITE_PRODUCTOS = 12;

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
    if (stockDisponible <= 0) {
      alert('Producto sin stock disponible');
      return;
    }
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
    if (e.target.tagName === 'IMG' || e.currentTarget.classList.contains('product-image-container')) {
      setSelectedProduct(product);
    }
  };

  const productosActivos = products.filter(product => product.estado);

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
      
      <div className="product-list">
        {productosActivos.slice(0, LIMITE_PRODUCTOS).map(product => {
          const isAdding = addingProductId === product.idProducto;
          const stockDisponible = getStockDisponibleReal(product);
          return (
            <div key={product.idProducto} className="product-card">
              <div onClick={(e) => handleImageClick(e, product)} className="product-image-container" style={{cursor: 'pointer'}}>
                <img src={product.imagen_url} alt={product.nombre} />
              </div>
              <div className="product-info">
                <h2>{product.nombre}</h2>
                <p className="product-price">{product.precioUnitario} €</p>
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
                    className={`btn-anadir ${isAdding ? 'agregado' : ''}`} 
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdding || stockDisponible === 0}
                  >
                    {isAdding ? 'Agregado ✓' : (stockDisponible === 0 ? 'Agotado' : 'Comprar')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
