import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ContextoCarrito } from '../context/ContextoCarrito';
import Modal from './Modal';
import FichaProducto from './Ficha_producto';
import './Productos.css';
import './Modal.css';

function ProductosCategoria() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const { agregarAlCarrito } = useContext(ContextoCarrito);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addingProductId, setAddingProductId] = useState(null);

  useEffect(() => {
    // Limpiar estado al desmontar
    return () => {
      setSelectedProduct(null);
    };
  }, []);
  const [categoria, setCategoria] = useState(null);
  const { categoriaId } = useParams();

  useEffect(() => {
    // Obtener información de la categoría directamente
    fetch(`http://localhost:8000/api/categorias/${categoriaId}/`)
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('No se pudo cargar la categoría');
      })
      .then(data => {
        setCategoria(data);
      })
      .catch(error => {});

    // Obtener productos de la categoría
    fetch(`http://localhost:8000/api/productos/?categoria=${categoriaId}`)
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
  }, [categoriaId]);

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

  const productosFiltrados = products.filter(product => product.estado);

  return (
    <div className="resultados-busqueda-container">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link> / {categoria ? categoria.nombre : 'Cargando...'}
      </div>
      
      <h1 className="titulo-bloque">
        {categoria ? categoria.nombre : 'Cargando...'}
      </h1>
      <h2 className="subtitulo-bloque">
        {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} disponible{productosFiltrados.length !== 1 ? 's' : ''}
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
            <p>No hay productos disponibles en esta categoría.</p>
          </div>
        )}
      </div>

      {selectedProduct && selectedProduct.idProducto && (
        <Modal onClose={handleCloseModal}>
          <FichaProducto 
            productId={selectedProduct.idProducto}
          />
        </Modal>
      )}
    </div>
  );
}

export default ProductosCategoria;
