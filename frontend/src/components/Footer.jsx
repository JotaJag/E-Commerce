import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import ModalContacto from './ModalContacto';

const Footer = () => {
  const [mostrarContacto, setMostrarContacto] = useState(false);

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <ul>
          <li><Link to="/acerca-de-nosotros">Acerca de Nosotros</Link></li>
          <li><Link to="/politica-privacidad">Política de Privacidad</Link></li>
          <li><Link to="/terminos-condiciones">Términos y Condiciones</Link></li>
          <li>
            <button
              type="button"
              className="link-button"
              onClick={() => setMostrarContacto(true)}
            >
              Contacto
            </button>
          </li>
        </ul>
        <p>&copy; 2026 TypeVibe86. Todos los derechos reservados.</p>
      </div>
      
      {mostrarContacto && (
        <ModalContacto onCerrar={() => setMostrarContacto(false)} />
      )}
    </footer>
  );
};

export default Footer;