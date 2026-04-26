import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Menus.css';

const MenuItem = ({ item, onContactoClick, isMobile, onClose }) => {
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
    onClose();
  };

  const linkContent = <span className="menu-text">{item.nombre}</span>;

  const mainLink = esEnlaceExterno ? (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
      {linkContent}
    </a>
  ) : esContacto ? (
    <a href="#" onClick={handleClick}>{linkContent}</a>
  ) : (
    <Link to={url} onClick={handleClick}>{linkContent}</Link>
  );

  return (
    <li className={hasSubmenus ? 'has-submenu' : ''}>
      {mainLink}
      {hasSubmenus && (
        <ul className="submenu">
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
  const navRef = useRef(null);

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

  const cerrarMenu = () => {
    setMenuAbierto(false);
    if (navRef.current) navRef.current.scrollTop = 0;
  };

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAbierto]);

  return (
    <>
      {menuAbierto && <div className="menu-overlay" onClick={cerrarMenu}></div>}

      <nav ref={navRef} className={`top-menu ${menuAbierto ? 'menu-open' : ''}`}>
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
