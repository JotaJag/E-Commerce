import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Auth.css';

const RestablecerPassword = () => {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        setCargando(true);

        try {
            const response = await fetch('http://localhost:8000/api/auth/password-reset-confirm/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    uid: uid,
                    token: token,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMensaje('Contraseña restablecida correctamente. Redirigiendo al inicio de sesión...');
                setTimeout(() => {
                    navigate('/iniciar-sesion');
                }, 3000);
            } else {
                setError(data.error || 'Ocurrió un error. El enlace puede haber expirado.');
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
                <h2>Restablecer Contraseña</h2>
                <p style={{ marginBottom: '20px', color: '#666' }}>Ingresa tu nueva contraseña a continuación.</p>
                {mensaje && <div className="success-message">{mensaje}</div>}
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="newPassword">Nueva Contraseña:</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar Nueva Contraseña:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="form-button" disabled={cargando}>
                        {cargando ? 'Restableciendo...' : 'Restablecer contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RestablecerPassword;
