import React, { useState, useContext } from 'react';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import { ContextoCarrito } from '../context/ContextoCarrito';
import './Auth.css';

const IniciarSesion = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { handleLoginSuccess } = usarAutenticacion();
    const { manejarLoginExitoso, articulosCarrito } = useContext(ContextoCarrito);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:8000/api/auth/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                handleLoginSuccess(data.user);
                await manejarLoginExitoso(articulosCarrito);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Login failed');
            }
        } catch (error) {
            setError('Ha ocurrido un error, pruebe de nuevo.');
        }
    };

    return (
        <div className="form-container">
            <div className="form-box">
                <h2>Acceder</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="form-button">Acceder</button>
                </form>
                <p className="switch-form-link" style={{ marginTop: '10px' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('recuperar-password'); }}>
                        ¿Olvidaste tu contraseña?
                    </a>
                </p>
                <p className="switch-form-link">
                    ¿No tienes una cuenta?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('register'); }}>
                        Regístrate
                    </a>
                </p>
            </div>
        </div>
    );
};

export default IniciarSesion;
