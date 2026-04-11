import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ProveedorCarrito } from './context/ContextoCarrito';
import { ProveedorAutenticacion } from './context/ContextoAutenticacion';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <ProveedorCarrito>
        <ProveedorAutenticacion>
          <App />
        </ProveedorAutenticacion>
      </ProveedorCarrito>
    </Router>
  </StrictMode>,
)
