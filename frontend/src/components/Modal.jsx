import React, { useEffect, useRef } from 'react';
import './Modal.css';

function Modal({ children, onClose }) {
  const modalRef = useRef(null);
  const triggerRef = useRef(document.activeElement);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Mover el foco al modal al abrirse
    const firstFocusable = modalRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => {
      document.body.style.overflow = 'unset';
      // Devolver el foco al elemento que abrió el modal
      triggerRef.current?.focus();
    };
  }, []);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus trap: mantener el foco dentro del modal
  const handleKeyDownTrap = (e) => {
    if (e.key !== 'Tab') return;

    const focusable = modalRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className="modal-content"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDownTrap}
        role="dialog"
        aria-modal="true"
        aria-hidden="false"
      >
        {React.isValidElement(children) ? React.cloneElement(children, { onClose }) : children}
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
      </div>
    </div>
  );
}

export default Modal;
