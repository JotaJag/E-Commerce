import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IniciarSesion from '../components/IniciarSesion';
import * as ContextoAutenticacion from '../context/ContextoAutenticacion';
import { ContextoCarrito } from '../context/ContextoCarrito';

const mockHandleLoginSuccess = vi.fn();
const mockManejarLoginExitoso = vi.fn().mockResolvedValue(true);

const renderComponente = () => {
    vi.spyOn(ContextoAutenticacion, 'usarAutenticacion').mockReturnValue({
        handleLoginSuccess: mockHandleLoginSuccess,
    });

    const utils = render(
        <ContextoCarrito.Provider value={{ manejarLoginExitoso: mockManejarLoginExitoso, articulosCarrito: [] }}>
            <IniciarSesion onNavigate={vi.fn()} />
        </ContextoCarrito.Provider>
    );

    const emailInput = utils.container.querySelector('input[type="email"]');
    const passwordInput = utils.container.querySelector('input[type="password"]');
    return { ...utils, emailInput, passwordInput };
};

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
});

describe('IniciarSesion — renderizado', () => {
    it('muestra el formulario con campos de email y contraseña', () => {
        const { emailInput, passwordInput } = renderComponente();
        expect(emailInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Acceder' })).toBeInTheDocument();
    });

    it('no muestra mensaje de error al cargarse', () => {
        renderComponente();
        expect(screen.queryByRole('heading', { name: 'Acceder' })).toBeInTheDocument();
        expect(document.querySelector('.error-message')).not.toBeInTheDocument();
    });
});

describe('IniciarSesion — login exitoso', () => {
    it('guarda el token y llama a handleLoginSuccess con el usuario', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'abc123', user: { email: 'user@test.com' } }),
        });

        const { emailInput, passwordInput } = renderComponente();
        await userEvent.type(emailInput, 'user@test.com');
        await userEvent.type(passwordInput, 'password123');
        fireEvent.click(screen.getByRole('button', { name: 'Acceder' }));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('abc123');
            expect(mockHandleLoginSuccess).toHaveBeenCalledWith({ email: 'user@test.com' });
        });
    });

    it('llama a manejarLoginExitoso para fusionar el carrito', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ token: 'abc123', user: { email: 'user@test.com' } }),
        });

        const { emailInput, passwordInput } = renderComponente();
        await userEvent.type(emailInput, 'user@test.com');
        await userEvent.type(passwordInput, 'password123');
        fireEvent.click(screen.getByRole('button', { name: 'Acceder' }));

        await waitFor(() => {
            expect(mockManejarLoginExitoso).toHaveBeenCalledWith([]);
        });
    });
});

describe('IniciarSesion — login fallido', () => {
    it('muestra el error devuelto por el servidor', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Credenciales inválidas' }),
        });

        const { emailInput, passwordInput } = renderComponente();
        await userEvent.type(emailInput, 'user@test.com');
        await userEvent.type(passwordInput, 'wrongpass');
        fireEvent.click(screen.getByRole('button', { name: 'Acceder' }));

        await waitFor(() => {
            expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
        });
    });

    it('muestra mensaje genérico si hay error de red', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const { emailInput, passwordInput } = renderComponente();
        await userEvent.type(emailInput, 'user@test.com');
        await userEvent.type(passwordInput, 'password123');
        fireEvent.click(screen.getByRole('button', { name: 'Acceder' }));

        await waitFor(() => {
            expect(screen.getByText('Ha ocurrido un error, pruebe de nuevo.')).toBeInTheDocument();
        });
    });

    it('no guarda token si el login falla', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Credenciales inválidas' }),
        });

        const { emailInput, passwordInput } = renderComponente();
        await userEvent.type(emailInput, 'user@test.com');
        await userEvent.type(passwordInput, 'wrongpass');
        fireEvent.click(screen.getByRole('button', { name: 'Acceder' }));

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBeNull();
        });
    });
});
