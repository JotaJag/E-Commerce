import stripe
import json
import time
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Pedido, LineaPedido, Producto, Cliente, MovimientoStock

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY

_tasa_iva_cache = None


def _obtener_o_crear_tasa_iva():
    """Obtiene o crea una tasa de IVA del 21% inclusivo en Stripe (caché en memoria)."""
    global _tasa_iva_cache
    if _tasa_iva_cache:
        return _tasa_iva_cache
    try:
        tasas = stripe.TaxRate.list(active=True, limit=20)
        for tasa in tasas.data:
            if tasa.percentage == 21.0 and tasa.inclusive:
                _tasa_iva_cache = tasa.id
                return tasa.id
        tasa = stripe.TaxRate.create(
            display_name='IVA',
            percentage=21.0,
            inclusive=True,
            country='ES',
            description='IVA español 21%',
        )
        _tasa_iva_cache = tasa.id
        return tasa.id
    except Exception as e:
        print(f"⚠️ No se pudo crear tasa IVA en Stripe: {e}")
        return None


def _crear_cupon_descuento(carrito_items, total_descuento_cents):
    """Crea un cupón Stripe one-time con el importe total de descuento."""
    # Intentar nombre descriptivo si todos los ítems tienen el mismo % de descuento
    porcentajes = set(
        item['descuentoEfectivo']
        for item in carrito_items
        if item.get('descuentoEfectivo', 0) > 0
    )
    if len(porcentajes) == 1:
        pct = int(list(porcentajes)[0])
        nombre = f"Descuento {pct}%"
    else:
        nombre = "Descuentos aplicados"

    return stripe.Coupon.create(
        amount_off=total_descuento_cents,
        currency='eur',
        name=nombre,
        duration='once',
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_sesion_pago(request):
    try:
        carrito_items = request.data.get('items', [])

        if not carrito_items:
            return Response({'error': 'El carrito está vacío'}, status=status.HTTP_400_BAD_REQUEST)

        # Validar stock
        for item in carrito_items:
            try:
                producto = Producto.objects.get(idProducto=item['id'])
                if producto.stock < item['cantidad']:
                    return Response(
                        {'error': f'Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Producto.DoesNotExist:
                return Response({'error': f'Producto {item["id"]} no encontrado'}, status=status.HTTP_400_BAD_REQUEST)

        tasa_iva_id = _obtener_o_crear_tasa_iva()

        # Construir line_items usando el precio ORIGINAL (sin descuento)
        line_items = []
        total_descuento_cents = 0

        for item in carrito_items:
            precio_original = float(item.get('precioOriginal', item['precio']))
            precio_final = float(item['precio'])
            ahorro_item = round((precio_original - precio_final) * item['cantidad'], 2)
            total_descuento_cents += int(round(ahorro_item * 100))

            caracteristicas = [
                item[k] for k in ('marca', 'modelo', 'color', 'tipo') if item.get(k)
            ]
            product_data = {'name': item['nombre']}
            if caracteristicas:
                product_data['description'] = ' · '.join(caracteristicas)
            imagen_url = item.get('imagen', '')
            if imagen_url and imagen_url.startswith(('http://', 'https://')):
                product_data['images'] = [imagen_url]

            line_item = {
                'price_data': {
                    'currency': 'eur',
                    'product_data': product_data,
                    'unit_amount': int(round(precio_original * 100)),
                },
                'quantity': item['cantidad'],
            }
            if tasa_iva_id:
                line_item['tax_rates'] = [tasa_iva_id]

            line_items.append(line_item)

        # Crear cupón si hay descuentos
        discounts = []
        if total_descuento_cents > 0:
            cupon = _crear_cupon_descuento(carrito_items, total_descuento_cents)
            discounts = [{'coupon': cupon.id}]

        # Preparar metadata compacta para no exceder límites de Stripe (max 500 chars por value)
        items_meta = ','.join(f"{item['id']}|{item['cantidad']}" for item in carrito_items)

        # Construir payment_intent_data y metadata, y añadir dirección del cliente si existe
        payment_intent_data = {
            'description': f'Pedido de {request.user.email} — {len(carrito_items)} artículo(s)',
            'statement_descriptor_suffix': 'TIENDA ONLINE',
        }

        metadata = {
            'user_id': str(request.user.id),
            # formato compacto: id|cantidad,id2|cantidad2 ...
            'items': items_meta,
        }

        # Intentar obtener datos del cliente para prellenar shipping
        try:
            cliente_obj = Cliente.objects.get(usuario=request.user)
        except Cliente.DoesNotExist:
            cliente_obj = None

        if cliente_obj:
            # Construir objeto shipping para crear/actualizar un Stripe Customer
            nombre_cliente = request.user.email
            try:
                if hasattr(request.user, 'get_full_name') and callable(request.user.get_full_name):
                    nombre_full = request.user.get_full_name()
                    if nombre_full:
                        nombre_cliente = nombre_full
            except Exception:
                pass

            shipping = {
                'name': nombre_cliente,
                'address': {
                    'line1': cliente_obj.direccion or '',
                    'line2': '',
                    'city': cliente_obj.ciudad or '',
                    'state': cliente_obj.provincia or '',
                    'postal_code': cliente_obj.codigoPostal or '',
                    'country': 'ES',
                }
            }

            # Buscar customer existente por email o crear/actualizar
            try:
                existing = stripe.Customer.list(email=request.user.email, limit=1)
                if existing and existing.data:
                    cust = existing.data[0]
                    stripe.Customer.modify(
                        cust.id,
                        shipping=shipping,
                        phone=cliente_obj.telefono or None,
                        name=nombre_cliente,
                    )
                    stripe_customer_id = cust.id
                else:
                    created = stripe.Customer.create(
                        email=request.user.email,
                        name=nombre_cliente,
                        shipping=shipping,
                        phone=cliente_obj.telefono or None,
                        metadata={'user_id': str(request.user.id)}
                    )
                    stripe_customer_id = created.id
            except Exception as e:
                print(f"⚠️ Error creando/actualizando Stripe Customer: {e}")
                stripe_customer_id = None

            # Añadir datos de dirección a metadata como respaldo
            metadata.update({
                'direccionEntrega': cliente_obj.direccion or '',
                'ciudadEntrega': cliente_obj.ciudad or '',
                'provinciaEntrega': cliente_obj.provincia or '',
                'codPostalEntrega': cliente_obj.codigoPostal or '',
                'telefono': cliente_obj.telefono or '',
            })

        # Solicitar dirección en Checkout (permite al usuario editarla).
        # Si existe un Stripe Customer con shipping, el formulario se prellenará pero seguirá siendo editable.
        shipping_collection = {'allowed_countries': ['ES', 'PT', 'FR', 'DE', 'IT']}

        session_params = dict(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            locale='es',
            # customer or customer_email will be añadidos más abajo según exista stripe_customer_id
            expires_at=int(time.time()) + 1800,
            phone_number_collection={'enabled': True},
            billing_address_collection='auto',
            custom_text={
                'submit': {
                    'message': 'Al confirmar aceptas nuestras condiciones de compra. Entrega en 3-5 días laborables.'
                },
                'after_submit': {
                    'message': 'Recibirás un email de confirmación. Soporte: soporte@tienda.com'
                },
            },
            payment_intent_data=payment_intent_data,
            success_url=settings.STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata=metadata,
        )

        if shipping_collection is not None:
            session_params['shipping_address_collection'] = shipping_collection

        if discounts:
            session_params['discounts'] = discounts

        # Añadir customer (preferido) o customer_email si no existe customer
        if 'stripe_customer_id' in locals() and stripe_customer_id:
            session_params['customer'] = stripe_customer_id
        else:
            session_params['customer_email'] = request.user.email

        checkout_session = stripe.checkout.Session.create(**session_params)

        print(f"Sesión de Stripe creada: {checkout_session.id}")
        return Response({'sessionId': checkout_session.id, 'url': checkout_session.url})

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _crear_pedido_desde_sesion(session, user):
    """
    Crea el pedido y reduce el stock a partir de una sesión de Stripe completada.
    Lee la dirección de envío directamente de session.shipping_details.
    """
    meta = session.get('metadata', {}) or {}
    raw_items = meta.get('items', '')
    # Soportar tanto el antiguo formato JSON (lista de dicts) como el nuevo compacto "id|cantidad,id2|cantidad2"
    items = []
    if raw_items:
        try:
            if raw_items.strip().startswith('['):
                items = json.loads(raw_items)
            else:
                pairs = [p for p in raw_items.split(',') if p]
                for pair in pairs:
                    if '|' in pair:
                        pid, qty = pair.split('|', 1)
                        try:
                            cantidad = int(qty)
                        except ValueError:
                            cantidad = 1
                        items.append({'id': pid, 'cantidad': cantidad})
                    else:
                        # formato inesperado: sólo id
                        items.append({'id': pair, 'cantidad': 1})
        except Exception as e:
            print(f"⚠️ Error parseando metadata items: {e}")
    cliente = Cliente.objects.get(usuario=user)

    # Leer dirección desde Stripe (shipping_details) con fallback a metadata
    shipping = session.get('shipping_details') or {}
    address = shipping.get('address') or {}
    customer_details = session.get('customer_details') or {}

    linea1 = address.get('line1', '')
    linea2 = address.get('line2', '') or ''
    direccion = f"{linea1}, {linea2}".rstrip(', ') if linea2 else linea1

    pedido = Pedido.objects.create(
        cliente=cliente,
        direccionEntrega=direccion or meta.get('direccionEntrega', ''),
        ciudadEntrega=address.get('city', '') or meta.get('ciudadEntrega', ''),
        provinciaEntrega=address.get('state', '') or meta.get('provinciaEntrega', ''),
        codPostalEntrega=address.get('postal_code', '') or meta.get('codPostalEntrega', ''),
        telefono=customer_details.get('phone', '') or meta.get('telefono', ''),
        porcentaje_iva=21,
        pagado=True,
        stripe_session_id=session['id'],
        stripe_payment_intent=session.get('payment_intent', ''),
    )

    for item in items:
        try:
            producto = Producto.objects.get(idProducto=item['id'])

            if producto.stock < item['cantidad']:
                print(f"❌ Stock insuficiente para {producto.nombre}")
                continue

            # Congelar precio usando precio con descuento si aplica, sino precio unitario
            try:
                precio_congelado = producto.precio_con_descuento
            except Exception:
                precio_congelado = producto.precioUnitario

            LineaPedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=item['cantidad'],
                precio_congelado=precio_congelado,
            )

            stock_anterior = producto.stock
            producto.stock -= item['cantidad']
            producto.save()

            MovimientoStock.objects.create(
                producto=producto,
                tipo='venta',
                cantidad=-item['cantidad'],
                stock_anterior=stock_anterior,
                stock_nuevo=producto.stock,
                motivo=f"Venta - Pedido #{pedido.idPedido}",
                usuario=user,
            )

        except Producto.DoesNotExist:
            print(f"Producto {item['id']} no encontrado")

    return pedido


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmar_pedido(request):
    """Crea el pedido tras pago exitoso (fallback sin webhook)."""
    try:
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'Se requiere el session_id'}, status=status.HTTP_400_BAD_REQUEST)

        if Pedido.objects.filter(stripe_session_id=session_id).exists():
            return Response({'message': 'Pedido ya creado'})

        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != 'paid':
            return Response({'error': 'El pago no ha sido completado'}, status=status.HTTP_400_BAD_REQUEST)

        pedido = _crear_pedido_desde_sesion(session, request.user)
        print(f"✅ Pedido #{pedido.idPedido} creado para {request.user.email}")
        return Response({'message': 'Pedido creado exitosamente', 'pedido_id': pedido.idPedido})

    except Exception as e:
        print(f"❌ Error al crear pedido: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def webhook_stripe(request):
    """Webhook para recibir eventos de Stripe y crear el pedido."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        try:
            user = User.objects.get(id=session['metadata']['user_id'])
            pedido = _crear_pedido_desde_sesion(session, user)
            print(f"✅ Pedido #{pedido.idPedido} creado para {user.email}")
        except Exception as e:
            print(f"❌ Error al crear pedido: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response(status=status.HTTP_200_OK)
