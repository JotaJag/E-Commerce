import { useContext } from 'react';
import './App.css';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Header from './components/Header';
import './components/Header.css';
import Banner from './components/Banner';
import './components/Banner.css';
import Footer from './components/Footer';
import './components/Footer.css';
import Productos from './components/Productos';
import ProductosDestacados from './components/ProductosDestacados';
import './components/Productos.css';
import ResultadosBusqueda from './components/ResultadosBusqueda';
import ProductosCategoria from './components/ProductosCategoria';
import ProductosColeccion from './components/ProductosColeccion';
import Colecciones from './components/Colecciones';
import ColeccionesDestacadas from './components/ColeccionesDestacadas';
import IniciarSesion from './components/IniciarSesion';
import Registro from './components/Registro';
import SolicitarRecuperacion from './components/SolicitarRecuperacion';
import RestablecerPassword from './components/RestablecerPassword';
import Carrito from './components/Carrito';
import PagoExitoso from './components/PagoExitoso';
import Profile from './components/Profile';
import RutaProtegida from './components/RutaProtegida';
import Dashboard from './components/Admin/Dashboard';
import AcercaDeNosotros from './components/AcercaDeNosotros';
import PoliticaPrivacidad from './components/PoliticaPrivacidad';
import TerminosCondiciones from './components/TerminosCondiciones';
import ScrollToTop from './components/ScrollToTop';
import ConsentBanner from './components/ConsentBanner';
import { usarAutenticacion } from './context/ContextoAutenticacion';

const AppContent = () => {
  const { user, handleLoginSuccess, handleLogout } = usarAutenticacion();
  const navigate = useNavigate();
  const handleAuthNavigation = (page) => {
    navigate(`/${page}`);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <Header />
      <ScrollToTop />
      <main id="main-content" className="main-content">
        <Routes>
          <Route path="/" element={
            <div className="home-sections">
              <section className="home-section"><Banner /></section>
              <section className="home-section"><ColeccionesDestacadas /></section>
              <section className="home-section"><ProductosDestacados /></section>
            </div>
          } />
          <Route path="/productos" element={<Productos />} />
          <Route path="/categoria/:categoriaId" element={<ProductosCategoria />} />
          <Route path="/colecciones" element={<Colecciones />} />
          <Route path="/coleccion/:coleccionNombre" element={<ProductosColeccion />} />
          <Route path="/busqueda" element={<ResultadosBusqueda />} />
          <Route path="/login" element={<IniciarSesion onNavigate={handleAuthNavigation} />} />
          <Route path="/register" element={<Registro onNavigate={handleAuthNavigation} />} />
          <Route path="/recuperar-password" element={<SolicitarRecuperacion />} />
          <Route path="/restablecer-password/:uid/:token" element={<RestablecerPassword />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/pago" element={<Navigate to="/carrito" replace />} />
          <Route path="/pago-exitoso" element={<PagoExitoso />} />
          <Route path="/profile" element={<RutaProtegida />}>
            <Route path="" element={<Profile />} />
          </Route>
          <Route path="/acerca-de-nosotros" element={<AcercaDeNosotros />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
          <Route path="/terminos-condiciones" element={<TerminosCondiciones />} />
          <Route path="/admin" element={<Dashboard />} />
        </Routes>
      </main>
      <ConsentBanner />
      <Footer />
    </>
  );
};

function App() {
  return (
      <AppContent />
  );
}

export default App;
