import { Link } from 'react-router-dom';
import './PoliticaPrivacidad.css';

function PoliticaPrivacidad() {
  return (
    <div className="politica-container">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link> / Política de Privacidad
      </div>

      <section className="politica-hero">
        <h1>Política de Privacidad</h1>
        <p className="politica-subtitulo">Última actualización: 31 de enero de 2026</p>
      </section>

      <section className="politica-contenido">
        <div className="politica-seccion">
          <h2>1. Información que Recopilamos</h2>
          <p>
            En TypeVibe86, nos comprometemos a proteger tu privacidad. Recopilamos información
            que nos proporcionas directamente cuando:
          </p>
          <ul>
            <li>Creas una cuenta en nuestra tienda</li>
            <li>Realizas una compra</li>
            <li>Te suscribes a nuestro boletín</li>
            <li>Nos contactas a través de nuestros formularios</li>
          </ul>
          <p>
            Esta información puede incluir: nombre, dirección de correo electrónico, dirección
            de envío, número de teléfono e información de pago.
          </p>
        </div>

        <div className="politica-seccion">
          <h2>2. Uso de la Información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul>
            <li>Procesar y gestionar tus pedidos</li>
            <li>Comunicarnos contigo sobre tu cuenta o pedidos</li>
            <li>Mejorar nuestros productos y servicios</li>
            <li>Personalizar tu experiencia de compra</li>
            <li>Enviarte información promocional (con tu consentimiento)</li>
            <li>Prevenir fraudes y garantizar la seguridad de nuestra plataforma</li>
          </ul>
        </div>

        <div className="politica-seccion">
          <h2>3. Protección de Datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger
            tu información personal contra acceso no autorizado, pérdida, destrucción o alteración.
            Todas las transacciones de pago se procesan a través de pasarelas de pago seguras y
            encriptadas.
          </p>
        </div>

        <div className="politica-seccion">
          <h2>4. Compartir Información</h2>
          <p>
            No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:
          </p>
          <ul>
            <li>Con proveedores de servicios que nos ayudan a operar nuestro negocio
            (procesadores de pago, servicios de envío)</li>
            <li>Cuando sea requerido por ley o para proteger nuestros derechos legales</li>
            <li>Con tu consentimiento explícito</li>
          </ul>
        </div>

        <div className="politica-seccion">
          <h2>5. Cookies</h2>
          <p>
            Utilizamos cookies y tecnologías similares para mejorar tu experiencia de navegación,
            analizar el tráfico del sitio y personalizar el contenido. Puedes configurar tu
            navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades
            del sitio.
          </p>
        </div>

        <div className="politica-seccion">
          <h2>6. Tus Derechos</h2>
          <p>Tienes derecho a:</p>
          <ul>
            <li>Acceder a tu información personal</li>
            <li>Solicitar la corrección de datos inexactos</li>
            <li>Solicitar la eliminación de tus datos</li>
            <li>Oponerte al procesamiento de tus datos</li>
            <li>Solicitar la portabilidad de tus datos</li>
            <li>Retirar tu consentimiento en cualquier momento</li>
          </ul>
        </div>

        <div className="politica-seccion">
          <h2>7. Retención de Datos</h2>
          <p>
            Conservamos tu información personal durante el tiempo necesario para cumplir con
            los propósitos descritos en esta política, a menos que la ley requiera o permita
            un período de retención más largo.
          </p>
        </div>

        <div className="politica-seccion">
          <h2>8. Menores de Edad</h2>
          <p>
            Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos
            intencionadamente información personal de menores. Si descubrimos que hemos
            recopilado información de un menor, la eliminaremos de inmediato.
          </p>
        </div>

        <div className="politica-seccion">
          <h2>9. Cambios en esta Política</h2>
          <p>
            Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos
            sobre cambios significativos publicando la nueva política en esta página y
            actualizando la fecha de "última actualización".
          </p>
        </div>

        <div className="politica-seccion">
          <h2>10. Contacto</h2>
          <p>
            Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos
            tus datos personales, por favor contáctanos a través de nuestro formulario de
            contacto o en: <strong>privacidad@typevibe86.com</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

export default PoliticaPrivacidad;
