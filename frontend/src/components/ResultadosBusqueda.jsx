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
  
  // Normalizar texto: eliminar diacríticos y pasar a minúsculas
  const normalize = (s) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Levenshtein para similitud (fuzzy)
  const levenshtein = (a = '', b = '') => {
    const al = a.length, bl = b.length;
    if (al === 0) return bl;
    if (bl === 0) return al;
    const v0 = new Array(bl + 1).fill(0);
    const v1 = new Array(bl + 1).fill(0);
    for (let j = 0; j <= bl; j++) v0[j] = j;
    for (let i = 0; i < al; i++) {
      v1[0] = i + 1;
      for (let j = 0; j < bl; j++) {
        const cost = a[i] === b[j] ? 0 : 1;
        v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
      }
      for (let j = 0; j <= bl; j++) v0[j] = v1[j];
    }
    return v1[bl];
  };

  const similarity = (s1, s2) => {
    const a = (s1 || '').toString();
    const b = (s2 || '').toString();
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    const dist = levenshtein(a, b);
    return 1 - dist / maxLen;
  };

  const FUZZ_THRESHOLD = 0.85;

  const productosFiltrados = products.filter(product => {
    if (!product.estado) return false;
    if (!busqueda) return false;

    const q = normalize(busqueda);

    const fields = [product.nombre, product.descripcion, product.marca, product.modelo, product.tipo, product.color];
    for (const f of fields) {
      const nf = normalize(f || '');
      if (!nf) continue;
      if (nf.includes(q)) return true;

      if (similarity(nf, q) >= FUZZ_THRESHOLD) return true;

      const tokens = nf.split(/\s+|[^a-z0-9]+/).filter(Boolean);
      for (const t of tokens) {
        if (similarity(t, q) >= FUZZ_THRESHOLD) return true;
      }

      const qlen = q.length;
      for (let L = Math.max(1, qlen - 1); L <= qlen + 1; L++) {
        if (L > nf.length) continue;
        for (let i = 0; i + L <= nf.length; i++) {
          const sub = nf.substring(i, i + L);
          if (similarity(sub, q) >= FUZZ_THRESHOLD) return true;
        }
      }
    }
    return false;
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
