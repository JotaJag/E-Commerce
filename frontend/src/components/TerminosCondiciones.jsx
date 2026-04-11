import { Link } from 'react-router-dom';
import './TerminosCondiciones.css';

function TerminosCondiciones() {
  return (
    <div className="terminos-container">
      <div className="breadcrumb">
        <Link to="/">Inicio</Link> / Términos y Condiciones
      </div>

      <section className="terminos-hero">
        <h1>Términos y Condiciones</h1>
        <p className="terminos-subtitulo">Última actualización: 31 de enero de 2026</p>
      </section>

      <section className="terminos-contenido">
        <div className="terminos-seccion">
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar TypeVibe86, aceptas estar sujeto a estos términos y condiciones.
            Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros
            servicios.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>2. Uso del Sitio Web</h2>
          <p>Te comprometes a:</p>
          <ul>
            <li>Proporcionar información precisa y actualizada al crear una cuenta</li>
            <li>Mantener la confidencialidad de tu cuenta y contraseña</li>
            <li>No utilizar el sitio para fines ilegales o no autorizados</li>
            <li>No interferir con el funcionamiento del sitio</li>
            <li>No intentar acceder a áreas restringidas del sistema</li>
          </ul>
        </div>

        <div className="terminos-seccion">
          <h2>3. Productos y Precios</h2>
          <p>
            Hacemos todo lo posible por mostrar los colores y características de nuestros productos
            con la mayor precisión posible. Sin embargo, no podemos garantizar que la visualización
            en tu dispositivo sea completamente precisa.
          </p>
          <p>
            Los precios están sujetos a cambios sin previo aviso. Nos reservamos el derecho de
            modificar o discontinuar productos en cualquier momento.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>4. Pedidos y Pagos</h2>
          <ul>
            <li>Todos los pedidos están sujetos a disponibilidad de stock</li>
            <li>Nos reservamos el derecho de rechazar o cancelar cualquier pedido</li>
            <li>Los pagos se procesan de forma segura a través de pasarelas certificadas</li>
            <li>Recibirás un correo de confirmación una vez procesado tu pedido</li>
            <li>Los precios incluyen IVA salvo que se indique lo contrario</li>
          </ul>
        </div>

        <div className="terminos-seccion">
          <h2>5. Envíos y Entregas</h2>
          <p>
            Los plazos de entrega son estimados y pueden variar según la ubicación y disponibilidad.
            No somos responsables de retrasos causados por empresas de mensajería o circunstancias
            fuera de nuestro control.
          </p>
          <p>
            Es tu responsabilidad proporcionar una dirección de envío correcta. No nos hacemos
            responsables de entregas a direcciones incorrectas proporcionadas por el cliente.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>6. Devoluciones y Reembolsos</h2>
          <p>Tienes derecho a:</p>
          <ul>
            <li>Devolver productos en perfecto estado dentro de los 14 días siguientes a la recepción</li>
            <li>Solicitar reembolso por productos defectuosos o dañados</li>
            <li>Los gastos de envío de devolución corren a cargo del cliente, salvo en caso de defecto</li>
            <li>Los reembolsos se procesarán en un plazo de 14 días tras recibir la devolución</li>
          </ul>
          <p>
            Los productos personalizados o productos de higiene no son reembolsables salvo defecto
            de fabricación.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>7. Propiedad Intelectual</h2>
          <p>
            Todo el contenido de este sitio web, incluyendo textos, gráficos, logos, imágenes y
            software, es propiedad de TypeVibe86 o sus proveedores de contenido y está protegido
            por las leyes de propiedad intelectual.
          </p>
          <p>
            No está permitido reproducir, distribuir o modificar ningún contenido sin autorización
            expresa por escrito.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>8. Limitación de Responsabilidad</h2>
          <p>
            En la medida permitida por la ley, TypeVibe86 no será responsable de:
          </p>
          <ul>
            <li>Daños indirectos, incidentales o consecuentes</li>
            <li>Pérdida de beneficios, datos o oportunidades comerciales</li>
            <li>Interrupciones del servicio o errores técnicos</li>
            <li>Uso inadecuado de los productos adquiridos</li>
          </ul>
        </div>

        <div className="terminos-seccion">
          <h2>9. Garantías</h2>
          <p>
            Los productos están cubiertos por la garantía legal establecida en la legislación vigente.
            Además, algunos productos pueden incluir garantía del fabricante.
          </p>
          <p>
            Para ejercer la garantía, debes presentar el justificante de compra y describir el defecto.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>10. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento.
            Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.
            Es tu responsabilidad revisar regularmente estos términos.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>11. Ley Aplicable</h2>
          <p>
            Estos términos se rigen por las leyes españolas. Cualquier disputa se resolverá en los
            tribunales competentes de España.
          </p>
        </div>

        <div className="terminos-seccion">
          <h2>12. Contacto</h2>
          <p>
            Para cualquier consulta sobre estos términos y condiciones, puedes contactarnos en:
            <strong> legal@typevibe86.com</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

export default TerminosCondiciones;
