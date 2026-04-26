import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import { ContextoCarrito } from '../context/ContextoCarrito';
import './Header.css';
import Menu from './Menus';
import './Menus.css';
import ModalContacto from './ModalContacto';
import CarritoSidebar from './CarritoSidebar';

const Header = () => {
  const logoUrl = 'http://localhost:8000/media/Logo.png';
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarContacto, setMostrarContacto] = useState(false);
  const { user, handleLogout } = usarAutenticacion();
  const { articulosCarrito, carritoSidebarAbierto, setCarritoSidebarAbierto } = useContext(ContextoCarrito);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  
  const totalItems = articulosCarrito.reduce((sum, item) => sum + item.cantidad, 0);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setShowUserMenu(false);
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showUserMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busqueda?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const onLogout = () => {
    handleLogout();
    setShowUserMenu(false);
  };

  return (
    <header className="app-header">
      <div className="header-main">
        <button className="menu-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Abrir menú">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="logo">
          <h1>
            <Link to="/">
              <img
                src={logoUrl}
                alt="TypeVibe86"
                className="header-logo-img"
              />
            </Link>
          </h1>
        </div>
        
        <form className="search-bar" onSubmit={handleSearch} role="search">
          <label htmlFor="search-input" className="visually-hidden">Buscar productos</label>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn" aria-label="Buscar">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </button>
        </form>
        
        <nav>
          <ul>
            <li className="user-menu-container">
              {user ? (
                <div className="user-menu-wrapper" ref={userMenuRef}>
                  <button
                    onClick={toggleUserMenu}
                    className="user-icon-button"
                    aria-label="Menú de usuario"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="24" 
                      height="24" 
                      fill="none" 
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      viewBox="0 0 24 24"
                      className="user-icon"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="user-badge"></span>
                  </button>
                  {showUserMenu && (
                    <div className="user-dropdown">
                      <Link to="/profile" onClick={() => setShowUserMenu(false)}>Perfil</Link>
                      {user.is_staff && (
                        <Link to="/admin" onClick={() => setShowUserMenu(false)}>Panel Admin</Link>
                      )}
                      <button onClick={onLogout}>Cerrar sesión</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="user-icon-button" aria-label="Iniciar sesión">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    fill="none" 
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                    className="user-icon"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </Link>
              )}
            </li>
            <li>
              <button className="cart-link" onClick={() => setCarritoSidebarAbierto(true)} aria-label="Abrir carrito">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                  className="cart-icon"
                >
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <Menu 
        menuAbierto={menuAbierto} 
        setMenuAbierto={setMenuAbierto}
        onContactoClick={() => {
          setMostrarContacto(true);
          setMenuAbierto(false);
        }}
      />
      
      {mostrarContacto && (
        <ModalContacto onCerrar={() => setMostrarContacto(false)} />
      )}

      <CarritoSidebar abierto={carritoSidebarAbierto} onCerrar={() => setCarritoSidebarAbierto(false)} />
    </header>
  );
};

export default Header;
