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

  const navGroups = [
    {
      label: 'Catálogo',
      items: [
        {
          key: 'productos', label: 'Productos',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
        },
        {
          key: 'inventario', label: 'Inventario',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>,
        },
        {
          key: 'categorias', label: 'Categorías',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
        },
        {
          key: 'colecciones', label: 'Colecciones',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
        },
      ],
    },
    {
      label: 'Contenido',
      items: [
        {
          key: 'banners', label: 'Banners',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
        },
        {
          key: 'menus', label: 'Menús',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="14" width="5" height="5" rx="1"/><rect x="16" y="14" width="5" height="5" rx="1"/><rect x="9.5" y="3" width="5" height="5" rx="1"/><path d="M5.5 17H4a1 1 0 0 1-1-1v-1a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v1a1 1 0 0 1-1 1h-1.5"/><line x1="12" y1="8" x2="12" y2="13"/></svg>,
        },
      ],
    },
    {
      label: 'Ventas',
      items: [
        {
          key: 'pedidos', label: 'Pedidos',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
        },
        {
          key: 'clientes', label: 'Clientes',
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
        },
      ],
    },
  ];

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="admin-brand-text">
            <span className="admin-brand-title">Admin</span>
            <span className="admin-brand-subtitle">TypeVibe86</span>
          </div>
        </div>
        <nav className="admin-nav">
          {navGroups.map(group => (
            <div key={group.label} className="admin-nav-group">
              <span className="admin-nav-section">{group.label}</span>
              {group.items.map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={seccionActiva === key ? 'active' : ''}
                  onClick={() => setSeccionActiva(key)}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="admin-content">
        {renderSeccion()}
      </main>
    </div>
  );
}

export default Dashboard;
