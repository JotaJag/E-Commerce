import { useState, useEffect } from 'react';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
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
  const [errors, setErrors] = useState({});
  const { user } = usarAutenticacion();

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

  // Prefill nombre/email if usuario autenticado
  useEffect(() => {
    if (!user) return;
    setFormData(prev => {
      const nombreActual = prev.nombre && prev.nombre.trim().length > 0;
      const emailActual = prev.email && prev.email.trim().length > 0;
      const nombreUsuario = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      return {
        ...prev,
        nombre: nombreActual ? prev.nombre : (nombreUsuario || prev.nombre),
        email: emailActual ? prev.email : (user.email || prev.email),
      };
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mensaje' && value.length > MAX_MENSAJE) return;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.nombre || formData.nombre.trim().length === 0) newErrors.nombre = 'El nombre es obligatorio.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) newErrors.email = 'Introduce un email válido.';
    if (!formData.asunto || formData.asunto.trim().length === 0) newErrors.asunto = 'Selecciona un motivo.';
    if (!formData.mensaje || formData.mensaje.trim().length === 0) newErrors.mensaje = 'El mensaje no puede estar vacío.';
    if (formData.mensaje && formData.mensaje.length > MAX_MENSAJE) newErrors.mensaje = `Máximo ${MAX_MENSAJE} caracteres.`;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // focus first error
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(firstKey);
      if (el) el.focus();
      return;
    }

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
                <div className={`form-grupo ${errors.nombre ? 'input-error' : ''}`}>
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
                      aria-invalid={errors.nombre ? 'true' : 'false'}
                  />
                    {errors.nombre && <div className="error-text">{errors.nombre}</div>}
                </div>

                <div className={`form-grupo ${errors.email ? 'input-error' : ''}`}>
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
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                  {errors.email && <div className="error-text">{errors.email}</div>}
                </div>
              </div>

              <div className={`form-grupo ${errors.asunto ? 'input-error' : ''}`}>
                <label htmlFor="asunto">Motivo de contacto</label>
                <select
                  id="asunto"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  required
                  aria-invalid={errors.asunto ? 'true' : 'false'}
                >
                  <option value="" disabled>Selecciona una opción...</option>
                  <option value="consulta-producto">Consulta sobre un producto</option>
                  <option value="pedido">Seguimiento de pedido</option>
                  <option value="devolucion">Devolución o cambio</option>
                  <option value="problema-tecnico">Problema técnico</option>
                  <option value="sugerencia">Sugerencia o mejora</option>
                  <option value="otro">Otro</option>
                </select>
                {errors.asunto && <div className="error-text">{errors.asunto}</div>}
              </div>

              <div className={`form-grupo ${errors.mensaje ? 'input-error' : ''}`}>
                <label htmlFor="mensaje">Mensaje</label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="5"
                  placeholder="Escribe aquí tu mensaje..."
                  aria-invalid={errors.mensaje ? 'true' : 'false'}
                />
                <span className={`char-contador ${formData.mensaje.length >= MAX_MENSAJE * 0.9 ? 'char-contador--limite' : ''}`}>
                  {formData.mensaje.length}/{MAX_MENSAJE}
                </span>
                {errors.mensaje && <div className="error-text">{errors.mensaje}</div>}
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
