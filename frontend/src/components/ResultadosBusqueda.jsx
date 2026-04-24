import { useState, useEffect, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ContextoCarrito } from '../context/ContextoCarrito';
import Modal from './Modal';
import FichaProducto from './Ficha_producto';
import './Productos.css';
import './Modal.css';

function ResultadosBusqueda() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { agregarAlCarrito } = useContext(ContextoCarrito);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Limpiar estado al desmontar
    return () => {
      setSelectedProduct(null);
    };
  }, []);

  useEffect(() => {
    // Limpiar estado al desmontar
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

  const handleQuantityChange = (productId, newQuantity) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, newQuantity),
    }));
  };

  const handleAddToCart = (product) => {
    const quantity = quantities[product.idProducto] || 1;
    setAddingProductId(product.idProducto);
    agregarAlCarrito(product, quantity);
    
    setTimeout(() => {
      setAddingProductId(null);
    }, 2000);
  };

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const busqueda = searchParams.get('q');
  
  const productosFiltrados = products.filter(product => {
    if (!product.estado) return false;
    if (!busqueda) return false;
    
    const busquedaLower = busqueda.toLowerCase();
    return (
      product.nombre.toLowerCase().includes(busquedaLower) ||
      product.descripcion.toLowerCase().includes(busquedaLower) ||
      (product.marca && product.marca.toLowerCase().includes(busquedaLower)) ||
      (product.modelo && product.modelo.toLowerCase().includes(busquedaLower)) ||
      (product.tipo && product.tipo.toLowerCase().includes(busquedaLower)) ||
      (product.color && product.color.toLowerCase().includes(busquedaLower))
    );
  });

  return (
    <div className="resultados-busqueda-container">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link> / Búsqueda
      </div>
      
      <h1 className="titulo-bloque">
        {busqueda ? `Resultados para "${busqueda}"` : 'Búsqueda de productos'}
      </h1>
      <h2 className="subtitulo-bloque">
        {busqueda ? `${productosFiltrados.length} producto${productosFiltrados.length !== 1 ? 's' : ''} encontrado${productosFiltrados.length !== 1 ? 's' : ''}` : 'Introduce un término de búsqueda'}
      </h2>
      
      <div className="product-list">
        {productosFiltrados.length > 0 ? (
          productosFiltrados.map(product => {
            const isAdding = addingProductId === product.idProducto;
            return (
              <div key={product.idProducto} className="product-card">
                <div onClick={() => handleOpenModal(product)} className="product-image-container" style={{cursor: 'pointer'}}>
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
                  <div className="product-card-controls">
                    <div className="cantidad-control-card">
                      <button onClick={() => handleQuantityChange(product.idProducto, (quantities[product.idProducto] || 1) - 1)}>−</button>
                      <span>{quantities[product.idProducto] || 1}</span>
                      <button onClick={() => handleQuantityChange(product.idProducto, (quantities[product.idProducto] || 1) + 1)}>+</button>
                    </div>
                    <button 
                      className={`btn-anadir ${isAdding ? 'agregado' : ''}`} 
                      onClick={() => handleAddToCart(product)}
                      disabled={isAdding}
                    >
                      {isAdding ? 'Agregado ✓' : 'Comprar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-resultados">
            <p>{busqueda ? 'No se encontraron productos que coincidan con tu búsqueda.' : 'Introduce un término de búsqueda para ver resultados.'}</p>
            <Link to="/" className="btn-volver-inicio">Volver al inicio</Link>
          </div>
        )}
      </div>
      
      {selectedProduct && selectedProduct.idProducto && (
        <Modal onClose={handleCloseModal}>
          <FichaProducto productId={selectedProduct.idProducto} />
        </Modal>
      )}
    </div>
  );
}

export default ResultadosBusqueda;
