import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const ContextoAutenticacion = createContext(null);

export const usarAutenticacion = () => useContext(ContextoAutenticacion);

export const ProveedorAutenticacion = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setCargando(false);
                setUsuario(null);
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/auth/user/', {
                    headers: {
                        'Authorization': `Token ${token}`,
                    },
                });
                if (response.ok) {
                    const userData = await response.json();
                    setUsuario(userData);
                } else {
                    localStorage.removeItem('token');
                    setUsuario(null);
                }
            } catch (error) {
                localStorage.removeItem('token');
                setUsuario(null);
            } finally {
                setCargando(false);
            }
        };

        checkUserLoggedIn();
    }, []);

    const handleLoginSuccess = (loggedInUser) => {
        setUsuario(loggedInUser);
        navigate('/');
    };

    const handleLogout = () => {
        setUsuario(null);
        localStorage.removeItem('token');
        navigate('/');
    };

    const value = {
        user: usuario,
        isLoading: cargando,
        handleLoginSuccess,
        handleLogout,
    };

    return <ContextoAutenticacion.Provider value={value}>{children}</ContextoAutenticacion.Provider>;
};

export default ContextoAutenticacion;
