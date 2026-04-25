import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Menus.css';

const MenuItem = ({ item, onContactoClick }) => {
  // Usar el campo url directamente del menú
  const url = item.url || '#';
  const esEnlaceExterno = url.startsWith('http://') || url.startsWith('https://');
  const esContacto = url === '#contacto';
  
  const handleClick = (e) => {
    if (esContacto) {
      e.preventDefault();
      onContactoClick();
    }
  };
  
  return (
    <li>
      {esEnlaceExterno ? (
        <a href={url} target="_blank" rel="noopener noreferrer"><span className="menu-text">{item.nombre}</span></a>
      ) : esContacto ? (
        <a href="#" onClick={handleClick}><span className="menu-text">{item.nombre}</span></a>
      ) : (
        <Link to={url}><span className="menu-text">{item.nombre}</span></Link>
      )}
      {item.submenus && item.submenus.length > 0 && (
        <ul className="submenu">
          {item.submenus.map(submenu => (
            <MenuItem key={submenu.id} item={submenu} onContactoClick={onContactoClick} />
          ))}
        </ul>
      )}
    </li>
  );
};

const Menu = ({ menuAbierto, setMenuAbierto, onContactoClick }) => {
  const [menus, setMenus] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/api/menus/')
      .then(response => {
        if (!response.ok) {
          throw new Error('Hay problemas para cargar los menús.');
        }
        return response.json();
      })
      .then(data => {
        const menuList = Array.isArray(data) ? data : (data.results || []);
        
        // Filtrar solo menús principales (sin padre)
        const menusPrincipales = menuList.filter(menu => !menu.padre_id);
        
        const processedMenus = [];
        menusPrincipales.forEach(menu => {
          // Si el menú se llama "productos", expandir sus submenús en lugar del menú padre
          if (menu.nombre.toLowerCase() === 'productos') {
            if (menu.submenus && menu.submenus.length > 0) {
              processedMenus.push(...menu.submenus);
            }
          } else {
            processedMenus.push(menu);
          }
        });

        setMenus(processedMenus);
      })
      .catch(error => {

      });
  }, []);

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <>
      {/* Botón hamburguesa para móvil */}
      <button className="menu-hamburger" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Overlay */}
      {menuAbierto && <div className="menu-overlay" onClick={cerrarMenu}></div>}

      {/* Menú */}
      <nav className={`top-menu ${menuAbierto ? 'menu-open' : ''}`}>
        <button className="menu-close" onClick={cerrarMenu} aria-label="Cerrar menú">
          ×
        </button>
        <ul onClick={cerrarMenu}>
          {menus.map(menu => (
            <MenuItem key={menu.id} item={menu} onContactoClick={onContactoClick} />
          ))}
        </ul>
      </nav>
    </>
  );
};

export default Menu;
