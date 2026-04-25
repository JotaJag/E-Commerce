import React, { useEffect } from 'react';
import './Modal.css';

function Modal({ children, onClose }) {
  useEffect(() => {
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    
    // Restaurar scroll al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {React.isValidElement(children) ? React.cloneElement(children, { onClose }) : children}
        <button className="modal-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
}

export default Modal;
