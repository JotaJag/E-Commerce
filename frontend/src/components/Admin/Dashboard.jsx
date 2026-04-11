import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usarAutenticacion } from '../../context/ContextoAutenticacion';
import GestionProductos from './GestionProductos';
import GestionCategorias from './GestionCategorias';
import GestionColecciones from './GestionColecciones';
import GestionBanners from './GestionBanners';
import GestionPedidos from './GestionPedidos';
import GestionClientes from './GestionClientes';
import GestionMenus from './GestionMenus';
import GestionInventario from './GestionInventario';
import './Dashboard.css';

function Dashboard() {
  const { user, isLoading } = usarAutenticacion();
  const [seccionActiva, setSeccionActiva] = useState('productos');

  if (isLoading) {
    return <div className="admin-loading">Cargando...</div>;
  }

  if (!user || !user.is_staff) {
    return <Navigate to="/" replace />;
  }

  const renderSeccion = () => {
    switch (seccionActiva) {
      case 'productos':
        return <GestionProductos />;
      case 'inventario':
        return <GestionInventario />;
      case 'categorias':
        return <GestionCategorias />;
      case 'colecciones':
        return <GestionColecciones />;
      case 'banners':
        return <GestionBanners />;
      case 'menus':
        return <GestionMenus />;
      case 'pedidos':
        return <GestionPedidos />;
      case 'clientes':
        return <GestionClientes />;
      default:
        return <GestionProductos />;
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <h2>Panel de Administración</h2>
        <nav className="admin-nav">
          <button 
            className={seccionActiva === 'productos' ? 'active' : ''}
            onClick={() => setSeccionActiva('productos')}
          >
            Productos
          </button>
          <button 
            className={seccionActiva === 'inventario' ? 'active' : ''}
            onClick={() => setSeccionActiva('inventario')}
          >
            Inventario
          </button>
          <button 
            className={seccionActiva === 'categorias' ? 'active' : ''}
            onClick={() => setSeccionActiva('categorias')}
          >
            Categorías
          </button>
          <button 
            className={seccionActiva === 'colecciones' ? 'active' : ''}
            onClick={() => setSeccionActiva('colecciones')}
          >
            Colecciones
          </button>
          <button 
            className={seccionActiva === 'banners' ? 'active' : ''}
            onClick={() => setSeccionActiva('banners')}
          >
            Banners
          </button>
          <button 
            className={seccionActiva === 'menus' ? 'active' : ''}
            onClick={() => setSeccionActiva('menus')}
          >
            Menús
          </button>
          <button 
            className={seccionActiva === 'pedidos' ? 'active' : ''}
            onClick={() => setSeccionActiva('pedidos')}
          >
            Pedidos
          </button>
          <button 
            className={seccionActiva === 'clientes' ? 'active' : ''}
            onClick={() => setSeccionActiva('clientes')}
          >
            Clientes
          </button>
        </nav>
      </aside>
      <main className="admin-content">
        {renderSeccion()}
      </main>
    </div>
  );
}

export default Dashboard;
