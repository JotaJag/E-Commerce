import React, { useState } from 'react';
import './Auth.css'; // Using the existing Auth styles if possible or custom

const SolicitarRecuperacion = () => {
    const [email, setEmail] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');
        setCargando(true);

        try {
            const response = await fetch('http://localhost:8000/api/auth/password-reset/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMensaje(data.message || 'Si el correo está registrado, recibirás un enlace para recuperar tu contraseña.');
                setEmail('');
            } else {
                setError(data.error || 'Ocurrió un error al procesar tu solicitud.');
            }
        } catch (error) {
            setError('Error de conexión al servidor.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-box">
                <h2>Recuperar Contraseña</h2>
                <p style={{ marginBottom: '20px', color: '#666' }}>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
                {mensaje && <div className="success-message">{mensaje}</div>}
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="form-button" disabled={cargando}>
                        {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SolicitarRecuperacion;
