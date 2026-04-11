import { useState, useEffect } from 'react';
import './ModalContacto.css';

const MAX_MENSAJE = 500;

function ModalContacto({ onCerrar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleEscape = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onCerrar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mensaje' && value.length > MAX_MENSAJE) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);

    // Simulación de envío (aquí integrarías con tu backend)
    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
      setTimeout(() => {
        onCerrar();
      }, 3000);
    }, 1500);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-contacto-overlay')) {
      onCerrar();
    }
  };

  return (
    <div className="modal-contacto-overlay" onClick={handleOverlayClick}>
      <div className="modal-contacto-contenido" role="dialog" aria-modal="true">
        <button className="modal-contacto-cerrar" onClick={onCerrar} aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {!enviado ? (
          <>
            <div className="modal-contacto-header">
              <h2>¿En qué podemos ayudarte?</h2>
              <p className="modal-contacto-descripcion">
                Cuéntanos lo que necesitas y te respondemos lo antes posible.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="modal-contacto-form" noValidate>
              <div className="form-fila">
                <div className="form-grupo">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />
                </div>

                <div className="form-grupo">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-grupo">
                <label htmlFor="asunto">Motivo de contacto</label>
                <select
                  id="asunto"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Selecciona una opción...</option>
                  <option value="consulta-producto">Consulta sobre un producto</option>
                  <option value="pedido">Seguimiento de pedido</option>
                  <option value="devolucion">Devolución o cambio</option>
                  <option value="problema-tecnico">Problema técnico</option>
                  <option value="sugerencia">Sugerencia o mejora</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="form-grupo">
                <label htmlFor="mensaje">Mensaje</label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Escribe aquí tu mensaje..."
                />
                <span className={`char-contador ${formData.mensaje.length >= MAX_MENSAJE * 0.9 ? 'char-contador--limite' : ''}`}>
                  {formData.mensaje.length}/{MAX_MENSAJE}
                </span>
              </div>

              <button
                type="submit"
                className="btn-enviar-contacto"
                disabled={enviando}
              >
                {enviando ? (
                  <span className="btn-spinner">
                    <span></span><span></span><span></span>
                  </span>
                ) : 'Enviar mensaje'}
              </button>
            </form>
          </>
        ) : (
          <div className="modal-contacto-exito">
            <div className="exito-icono">✓</div>
            <h2>¡Mensaje recibido!</h2>
            <p>Gracias por escribirnos, <strong>{formData.nombre}</strong>. Te contestaremos en breve en <strong>{formData.email}</strong>.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ModalContacto;
