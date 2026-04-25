import React, { useState } from 'react';
import { usarAutenticacion } from '../context/ContextoAutenticacion';
import './Auth.css';

const Registro = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const { handleLoginSuccess } = usarAutenticacion();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/auth/register/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    first_name: firstName,
                    last_name: lastName,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                setSuccessMessage('Registro exitoso. Serás redirigido en breve.');
                
                setTimeout(async () => {
                    await handleLoginSuccess(data.user);
                }, 1500);
            } else {
                const errorData = await response.json();
                let errorMessages = '';
                if (typeof errorData === 'object') {
                    errorMessages = Object.values(errorData).flat().join(' ');
                } else {
                    errorMessages = errorData || 'An unknown error occurred during registration.';
                }
                setError(errorMessages);
            }
        } catch (error) {
            setError('Ha ocurrido un error en la conexión. Por favor, inténtalo de nuevo.');
        }
    };

    return (
        <div className="form-container">
            <div className="form-box">
                <h2>Regístrate</h2>
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
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
                    <div className="form-group">
                        <label>Confirmar Contraseña</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Nombre</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Apellidos</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="form-button">Regístrate</button>
                </form>
                <p className="switch-form-link">
                    ¿Ya tienes una cuenta?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('login'); }}>
                        Accede
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Registro;
