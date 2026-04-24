import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { ProveedorCarrito, ContextoCarrito } from '../context/ContextoCarrito';

const productoEjemplo = {
    idProducto: 'PROD001',
    nombre: 'Ratón inalámbrico',
    descripcion: 'No tiene cable, se conecta por Bluetooth',
    precioUnitario: '19.99',
    imagen_url: null,
    marca: 'MarcaX',
    modelo: 'M001',
    color: 'Blanco',
    tipo: 'Accesorio',
};

const ConsumidorCarrito = ({ onRender }) => {
    const ctx = useContext(ContextoCarrito);
    onRender(ctx);
    return null;
};

const renderProveedor = (onRender) => {
    render(
        <ProveedorCarrito>
            <ConsumidorCarrito onRender={onRender} />
        </ProveedorCarrito>
    );
};

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lineas: [] }) });
});

describe('ContextoCarrito — carrito de invitado', () => {
    it('empieza con el carrito vacío sin localStorage', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx.articulosCarrito).toEqual([]));
    });

    it('agrega un producto al carrito cuando no está autenticado', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx).toBeDefined());

        await act(async () => {
            await ctx.agregarAlCarrito(productoEjemplo, 1);
        });

        expect(ctx.articulosCarrito).toHaveLength(1);
        expect(ctx.articulosCarrito[0].nombre).toBe(productoEjemplo.nombre);
        expect(ctx.articulosCarrito[0].cantidad).toBe(1);
    });

    it('acumula cantidad al agregar el mismo producto dos veces', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx).toBeDefined());

        await act(async () => {
            await ctx.agregarAlCarrito(productoEjemplo, 1);
            await ctx.agregarAlCarrito(productoEjemplo, 2);
        });

        expect(ctx.articulosCarrito).toHaveLength(1);
        expect(ctx.articulosCarrito[0].cantidad).toBe(3);
    });

    it('elimina un producto del carrito', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx).toBeDefined());

        await act(async () => {
            await ctx.agregarAlCarrito(productoEjemplo, 1);
        });

        await act(async () => {
            await ctx.eliminarDelCarrito(productoEjemplo);
        });

        expect(ctx.articulosCarrito).toHaveLength(0);
    });

    it('actualiza la cantidad de un artículo existente', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx).toBeDefined());

        await act(async () => {
            await ctx.agregarAlCarrito(productoEjemplo, 1);
        });

        await act(async () => {
            await ctx.actualizarCantidad(productoEjemplo, 5);
        });

        expect(ctx.articulosCarrito[0].cantidad).toBe(5);
    });

    it('vacía el carrito completamente', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx).toBeDefined());

        await act(async () => {
            await ctx.agregarAlCarrito(productoEjemplo, 3);
        });

        await act(async () => {
            await ctx.vaciarCarrito();
        });

        expect(ctx.articulosCarrito).toHaveLength(0);
    });

    it('persiste el carrito en localStorage al agregar artículos', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx).toBeDefined());

        await act(async () => {
            await ctx.agregarAlCarrito(productoEjemplo, 2);
        });

        const guardado = JSON.parse(localStorage.getItem('cartItems'));
        expect(guardado).toEqual([{ id: 'PROD001', cantidad: 2 }]);
    });
});

describe('ContextoCarrito — precio formateado', () => {
    it('convierte precioUnitario a número flotante', async () => {
        let ctx;
        renderProveedor((c) => { ctx = c; });
        await waitFor(() => expect(ctx).toBeDefined());

        await act(async () => {
            await ctx.agregarAlCarrito(productoEjemplo, 1);
        });

        expect(typeof ctx.articulosCarrito[0].precio).toBe('number');
        expect(ctx.articulosCarrito[0].precio).toBe(19.99);
    });
});
