import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ContextoCarrito = createContext();

const API_BASE_URL = 'http://localhost:8000/api/';

const formatearProducto = (producto, cantidad) => ({
    id: producto.idProducto,
    nombre: producto.nombre,
    descripcion: producto.descripcion || '',
    precio: parseFloat(producto.precio_con_descuento ?? producto.precioUnitario),
    precioOriginal: parseFloat(producto.precioUnitario),
    descuentoEfectivo: parseFloat(producto.descuento_efectivo ?? 0),
    cantidad,
    imagen: producto.imagen_url,
    marca: producto.marca || '',
    modelo: producto.modelo || '',
    color: producto.color || '',
    tipo: producto.tipo || '',
});

export const ProveedorCarrito = ({ children }) => {
    const [articulosCarrito, setArticulosCarrito] = useState([]);

    const [estaAutenticado, setEstaAutenticado] = useState(!!localStorage.getItem('token'));
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    const cargarCarritoInvitado = useCallback(async () => {
        try {
            const guardado = localStorage.getItem('cartItems');
            const items = guardado ? JSON.parse(guardado) : [];
            if (items.length === 0) return;

            const articulos = await Promise.all(
                items.map(async ({ id, cantidad }) => {
                    const res = await fetch(`${API_BASE_URL}productos/${id}/`);
                    if (!res.ok) return null;
                    return formatearProducto(await res.json(), cantidad);
                })
            );
            setArticulosCarrito(articulos.filter(Boolean));
        } catch {
            setArticulosCarrito([]);
        }
    }, []);

    const obtenerCarrito = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setEstaAutenticado(false);
            return;
        }

        setEstaAutenticado(true);
        setCargando(true);
        setError(null);
        
        try {
            const response = await fetch(`${API_BASE_URL}carrito-compras/`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
            });

            if (!response.ok) {
                const datosError = await response.json();
                setError(datosError.detail || 'Error al obtener el carrito.');
                setEstaAutenticado(false);
                setArticulosCarrito([]);
                return;
            }

            const datos = await response.json();
            setArticulosCarrito(
                datos?.lineas?.map(l => formatearProducto(l.producto, l.cantidad)) || []
            );
        } catch (err) {
            setError('Error de red o servidor no disponible.');
            setEstaAutenticado(false);
            setArticulosCarrito([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setEstaAutenticado(true);
            obtenerCarrito();
        } else {
            cargarCarritoInvitado();
        }
    }, [obtenerCarrito, cargarCarritoInvitado]);

    useEffect(() => {
        if (!estaAutenticado) {
            const soloIdYCantidad = articulosCarrito.map(({ id, cantidad }) => ({ id, cantidad }));
            localStorage.setItem('cartItems', JSON.stringify(soloIdYCantidad));
        }
    }, [articulosCarrito, estaAutenticado]);


    const actualizarCarritoBackend = useCallback(async (tipoAccion, payload) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Usuario no autenticado. Por favor, inicie sesión.");
            setEstaAutenticado(false);
            return false;
        }

        try {
            const respuesta = await fetch(`${API_BASE_URL}carrito-compras/${tipoAccion}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (respuesta.ok) {
                await obtenerCarrito();
                return true;
            } else {
                const datosError = await respuesta.json();
                setError(datosError.detail || `Error al ${tipoAccion}.`);
                if (respuesta.status === 401 || respuesta.status === 403) {
                    localStorage.removeItem('token');
                    setEstaAutenticado(false);
                    setArticulosCarrito([]);
                }
                return false;
            }
        } catch (err) {
            setError('Error de red o servidor no disponible.');
            return false;
        }
    }, [obtenerCarrito]);

    const manejarLoginExitoso = useCallback(async (articulosActuales) => {
        setEstaAutenticado(true);

        try {
            if (articulosActuales.length > 0) {
                const articulosInvitadoFormateados = articulosActuales.map(articulo => ({
                    product_id: articulo.id,
                    quantity: articulo.cantidad
                }));
                const fusionExitosa = await actualizarCarritoBackend('merge_cart', articulosInvitadoFormateados);
                if (!fusionExitosa) throw new Error("Error al fusionar carrito de invitado.");
                localStorage.removeItem('cartItems');
                setArticulosCarrito([]);
            }
            await obtenerCarrito();
            return true;
        } catch (e) {
            setError(e.message || "Error al fusionar carrito tras login.");
            return false;
        }
    }, [obtenerCarrito, actualizarCarritoBackend]);

    const agregarAlCarrito = async (producto, cantidad = 1) => {
        if (estaAutenticado) {
            await actualizarCarritoBackend('add_item', { product_id: producto.idProducto, quantity: cantidad });
        } else {
            setArticulosCarrito((articulosPrevios) => {
                const articuloExistente = articulosPrevios.find((articulo) => articulo.id === producto.idProducto);
                if (articuloExistente) {
                    return articulosPrevios.map((articulo) =>
                        articulo.id === producto.idProducto
                            ? { ...articulo, cantidad: articulo.cantidad + cantidad }
                            : articulo
                    );
                }
                return [...articulosPrevios, formatearProducto(producto, cantidad)];
            });
        }
    };

    const eliminarDelCarrito = async (producto) => {
        if (estaAutenticado) {
            await actualizarCarritoBackend('remove_item', { product_id: producto.idProducto });
        } else {
            setArticulosCarrito((articulosPrevios) => articulosPrevios.filter((articulo) => articulo.id !== producto.idProducto));
        }
    };

    const actualizarCantidad = async (producto, cantidad) => {
        if (estaAutenticado) {
            await actualizarCarritoBackend('update_quantity', { product_id: producto.idProducto, quantity: cantidad });
        } else {
            setArticulosCarrito((articulosPrevios) =>
                articulosPrevios.map((articulo) =>
                    articulo.id === producto.idProducto ? { ...articulo, cantidad } : articulo
                )
            );
        }
    };

    const vaciarCarrito = async () => {
        await (estaAutenticado ? actualizarCarritoBackend('clear_cart', {}) : setArticulosCarrito([]));
    };

    const value = {
        articulosCarrito,
        estaAutenticado,
        cargando,
        error,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        manejarLoginExitoso,
    };

    return (
        <ContextoCarrito.Provider value={value}>
            {children}
        </ContextoCarrito.Provider>
    );
};

export default ContextoCarrito;
