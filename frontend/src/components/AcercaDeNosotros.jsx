import { useState } from 'react';
import './AcercaDeNosotros.css';
import ModalContacto from './ModalContacto';

function AcercaDeNosotros() {
  const [mostrarContacto, setMostrarContacto] = useState(false);

  return (
    <div className="acerca-container">
      <section className="acerca-hero">
        <h1>Acerca de Nosotros</h1>
        <p className="acerca-subtitulo">Creada por apasionados de la tecnología, para quienes la viven cada día</p>
      </section>

      <section className="acerca-seccion">
        <div className="acerca-contenido">
          <div className="acerca-texto">
            <h2>Nuestra Historia</h2>
            <p>
              Todo empezó con una necesidad real: somos un equipo de personas a las que nos apasiona
              la tecnología y, después de buscar durante mucho tiempo productos que de verdad
              encajaran con lo que necesitábamos, decidimos crear nuestra propia tienda.
            </p>
            <p>
              Nada de catálogos genéricos ni artículos de relleno. Cada producto que encontrarás
              aquí ha pasado por nuestras propias manos y ha superado nuestro criterio más exigente:
              el de alguien que lo usaría a diario.
            </p>
          </div>
        </div>
      </section>

      <section className="acerca-valores">
        <h2>Nuestros Valores</h2>
        <div className="valores-grid">
          <div className="valor-card">
            <h3>Criterio propio</h3>
            <p>Solo vendemos lo que nosotros mismos usaríamos. Si no nos convence, no llega al catálogo.</p>
          </div>
          <div className="valor-card">
            <h3>Confianza</h3>
            <p>Información honesta, sin humo. Descripciones reales para que sepas exactamente lo que compras.</p>
          </div>
          <div className="valor-card">
            <h3>Pasión por la tecnología</h3>
            <p>No somos una empresa cualquiera: somos usuarios como tú, que vivimos rodeados de gadgets y accesorios.</p>
          </div>
          <div className="valor-card">
            <h3>Mejora continua</h3>
            <p>Actualizamos nuestro catálogo constantemente para estar al día con lo que realmente merece la pena.</p>
          </div>
        </div>
      </section>

      <section className="acerca-mision">
        <div className="mision-contenido">
          <h2>Nuestra Misión</h2>
          <p>
            Queremos que encontrar el producto tecnológico perfecto sea fácil. Sin tener que buscar
            durante horas ni arriesgarte con cosas de dudosa calidad. Nuestra misión es ser esa
            tienda en la que confías porque sabes que detrás hay gente que entiende lo que necesitas,
            porque lo necesita también.
          </p>
        </div>
      </section>

      <section className="acerca-contacto-seccion">
        <h2>¿Hablamos?</h2>
        <p>Si tienes alguna duda, sugerencia o simplemente quieres recomendarnos algo, estamos al otro lado.</p>
        <button 
          className="btn-contacto-primario"
          onClick={() => setMostrarContacto(true)}
        >
          Contáctanos
        </button>
      </section>

      {mostrarContacto && (
        <ModalContacto onCerrar={() => setMostrarContacto(false)} />
      )}
    </div>
  );
}

export default AcercaDeNosotros;
