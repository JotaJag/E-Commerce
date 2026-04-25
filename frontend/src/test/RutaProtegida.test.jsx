import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RutaProtegida from '../components/RutaProtegida';
import * as ContextoAutenticacion from '../context/ContextoAutenticacion';

const renderConRuta = (user, isLoading = false) => {
    vi.spyOn(ContextoAutenticacion, 'usarAutenticacion').mockReturnValue({ user, isLoading });

    return render(
        <MemoryRouter initialEntries={['/protegida']}>
            <Routes>
                <Route element={<RutaProtegida />}>
                    <Route path="/protegida" element={<div>Contenido protegido</div>} />
                </Route>
                <Route path="/login" element={<div>Página de login</div>} />
            </Routes>
        </MemoryRouter>
    );
};

describe('RutaProtegida', () => {
    it('muestra el contenido cuando el usuario está autenticado', () => {
        renderConRuta({ email: 'user@test.com' });
        expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    });

    it('redirige a /login cuando no hay usuario', () => {
        renderConRuta(null);
        expect(screen.getByText('Página de login')).toBeInTheDocument();
        expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
    });

    it('muestra mensaje de verificación mientras carga', () => {
        renderConRuta(null, true);
        expect(screen.getByText('Verificando autenticación...')).toBeInTheDocument();
    });

    it('no redirige mientras isLoading es true, aunque user sea null', () => {
        renderConRuta(null, true);
        expect(screen.queryByText('Página de login')).not.toBeInTheDocument();
    });
});
