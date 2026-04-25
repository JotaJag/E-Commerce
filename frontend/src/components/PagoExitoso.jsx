import React, { useEffect, useContext, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ContextoCarrito } from '../context/ContextoCarrito';
import './PagoExitoso.css';

const PagoExitoso = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { vaciarCarrito } = useContext(ContextoCarrito);
    const sessionId = searchParams.get('session_id');
    const [procesando, setProcesando] = useState(true);
    const [error, setError] = useState(null);
    const procesadoRef = useRef(false);

    useEffect(() => {
        const procesarPago = async () => {
            // Evitar múltiples ejecuciones
            if (procesadoRef.current) {
                return;
            }
            
            if (!sessionId) {
                setError('No se encontró el ID de sesión');
                setProcesando(false);
                return;
            }

            procesadoRef.current = true;

            try {
                const token = localStorage.getItem('token');
                
                // Confirmar el pedido en el backend
                const response = await fetch('http://localhost:8000/api/confirmar-pedido/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify({ session_id: sessionId })
                });

                if (response.ok) {
                    // Vaciar el carrito después de confirmar el pedido
                    await vaciarCarrito();
                } else {
                    const data = await response.json();
                    // No mostramos error si el pedido ya existe
                    if (!data.message || !data.message.includes('ya creado')) {
                        setError('Hubo un problema al confirmar el pedido');
                    }
                }
            } catch (err) {
                setError('Error de conexión');
            } finally {
                setProcesando(false);
            }
        };

        procesarPago();
    }, [sessionId]); // Removido vaciarCarrito de las dependencias

    return (
        <div className="pago-exitoso-container">
            <div className="pago-exitoso-contenido">
                {procesando ? (
                    <>
                        <div className="spinner"></div>
                        <h1>Procesando tu pedido...</h1>
                        <p className="mensaje-principal">Por favor espera mientras confirmamos tu pago.</p>
                    </>
                ) : error ? (
                    <>
                        <div className="icono-error">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                        </div>
                        <h1>Error</h1>
                        <p className="mensaje-principal">{error}</p>
                        <div className="botones-accion">
                            <button className="btn-principal" onClick={() => navigate('/')}>
                                Volver a la Tienda
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="icono-exito">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                        </div>
                        <h1>¡Pago Exitoso!</h1>
                        <p className="mensaje-principal">Tu pedido ha sido procesado correctamente.</p>
                        <p className="mensaje-secundario">
                            Recibirás un correo electrónico de confirmación con los detalles de tu pedido.
                        </p>
                        {sessionId && (
                            <p className="session-id">ID de sesión: {sessionId}</p>
                        )}
                        <div className="botones-accion">
                            <button 
                                className="btn-principal" 
                                onClick={() => navigate('/')}
                            >
                                Volver a la Tienda
                            </button>
                            <button 
                                className="btn-secundario" 
                                onClick={() => navigate('/profile')}
                            >
                                Ver mis Pedidos
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PagoExitoso;
