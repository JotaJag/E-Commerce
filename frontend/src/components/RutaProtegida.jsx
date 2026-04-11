import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usarAutenticacion } from '../context/ContextoAutenticacion';

const RutaProtegida = () => {
    const { user, isLoading } = usarAutenticacion();

    if (isLoading) {
        return <div>Verificando autenticación...</div>;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default RutaProtegida;
