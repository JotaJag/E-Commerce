import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Menus.css';

const MenuItem = ({ item, onContactoClick, isMobile, onClose }) => {
  const [open, setOpen] = useState(false);
  const url = item.url || '#';
  const esEnlaceExterno = url.startsWith('http://') || url.startsWith('https://');
  const esContacto = url === '#contacto';
  const hasSubmenus = item.submenus && item.submenus.length > 0;

  const handleClick = (e) => {
    if (esContacto) {
      e.preventDefault();
      onContactoClick();
      return;
    }
    if (isMobile && hasSubmenus) {
      e.preventDefault();
      setOpen(p => !p);
      return;
    }
    onClose();
  };

  const arrowIcon = hasSubmenus && isMobile && (
    <span className={`submenu-arrow ${open ? 'open' : ''}`} aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );

  const linkContent = <span className="menu-text">{item.nombre}</span>;

  return (
    <li className={hasSubmenus ? 'has-submenu' : ''}>
      {esEnlaceExterno ? (
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          {linkContent}
        </a>
      ) : esContacto ? (
        <a href="#" onClick={handleClick} aria-expanded={hasSubmenus && isMobile ? open : undefined}>
          {linkContent}
          {arrowIcon}
        </a>
      ) : (
        <Link to={url} onClick={handleClick} aria-expanded={hasSubmenus && isMobile ? open : undefined}>
          {linkContent}
          {arrowIcon}
        </Link>
      )}

      {hasSubmenus && (
        <ul className={`submenu ${isMobile && open ? 'submenu-open' : ''}`}>
          {item.submenus.map(sub => (
            <MenuItem
              key={sub.id}
              item={sub}
              onContactoClick={onContactoClick}
              isMobile={isMobile}
              onClose={onClose}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const Menu = ({ menuAbierto, setMenuAbierto, onContactoClick }) => {
  const [menus, setMenus] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/menus/')
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar los menús.');
        return res.json();
      })
      .then(data => {
        const menuList = Array.isArray(data) ? data : (data.results || []);
        const menusPrincipales = menuList.filter(m => !m.padre_id);
        const processed = [];
        menusPrincipales.forEach(menu => {
          if (menu.nombre.toLowerCase() === 'productos') {
            if (menu.submenus?.length > 0) processed.push(...menu.submenus);
          } else {
            processed.push(menu);
          }
        });
        setMenus(processed);
      })
      .catch(() => {});
  }, []);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <>
      <button className="menu-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
        <span></span>
        <span></span>
        <span></span>
      </button>

      {menuAbierto && <div className="menu-overlay" onClick={cerrarMenu}></div>}

      <nav className={`top-menu ${menuAbierto ? 'menu-open' : ''}`}>
        <button className="menu-close" onClick={cerrarMenu} aria-label="Cerrar menú">×</button>
        <ul>
          {menus.map(menu => (
            <MenuItem
              key={menu.id}
              item={menu}
              onContactoClick={onContactoClick}
              isMobile={isMobile}
              onClose={cerrarMenu}
            />
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Menu;
