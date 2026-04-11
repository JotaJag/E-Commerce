import stripe
import json
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Pedido, LineaPedido, Producto, Cliente, MovimientoStock

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_sesion_pago(request):
    """
    Crea una sesión de pago de Stripe
    """
    try:
        carrito_items = request.data.get('items', [])
        direccion_entrega = request.data.get('direccionEntrega', '')
        ciudad_entrega = request.data.get('ciudadEntrega', '')
        provincia_entrega = request.data.get('provinciaEntrega', '')
        cod_postal_entrega = request.data.get('codPostalEntrega', '')
        telefono = request.data.get('telefono', '')
        
        if not carrito_items:
            return Response(
                {'error': 'El carrito está vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar stock disponible antes de crear la sesión de pago
        for item in carrito_items:
            try:
                producto = Producto.objects.get(idProducto=item['id'])
                if producto.stock < item['cantidad']:
                    return Response(
                        {'error': f'Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Producto.DoesNotExist:
                return Response(
                    {'error': f'Producto {item["id"]} no encontrado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Convertir items del carrito a line_items de Stripe
        line_items = []
        for item in carrito_items:
            # Construir descripción detallada del producto
            descripcion_parts = []
            
            # Agregar descripción base si existe
            if item.get('descripcion'):
                descripcion_parts.append(item['descripcion'])
            
            # Agregar características del producto
            caracteristicas = []
            if item.get('marca'):
                caracteristicas.append(item['marca'])
            if item.get('modelo'):
                caracteristicas.append(item['modelo'])
            if item.get('color'):
                caracteristicas.append(item['color'])
            if item.get('tipo'):
                caracteristicas.append(item['tipo'])
            
            if caracteristicas:
                descripcion_parts.append(' - '.join(caracteristicas))
            
            descripcion = '\n'.join(descripcion_parts) if descripcion_parts else None
            
            product_data = {
                'name': item['nombre'],
            }
            
            # Añadir descripción si existe
            if descripcion:
                product_data['description'] = descripcion
            
            # Añadir imagen si existe y es una URL válida
            imagen_url = item.get('imagen', '')
            if imagen_url and (imagen_url.startswith('http://') or imagen_url.startswith('https://')):
                product_data['images'] = [imagen_url]
            
            line_items.append({
                'price_data': {
                    'currency': 'eur',
                    'product_data': product_data,
                    'unit_amount': int(float(item['precio']) * 100),  # Stripe usa centavos
                },
                'quantity': item['cantidad'],
            })
        
        # Crear la sesión de checkout de Stripe
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            success_url=settings.STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata={
                'user_id': request.user.id,
                'direccionEntrega': direccion_entrega,
                'ciudadEntrega': ciudad_entrega,
                'provinciaEntrega': provincia_entrega,
                'codPostalEntrega': cod_postal_entrega,
                'telefono': telefono,
                'items': json.dumps(carrito_items),  # Guardar items para el webhook
            }
        )
        
        print(f"Sesión de Stripe creada: {checkout_session.id}")
        print(f"URL de Stripe: {checkout_session.url}")
        
        return Response({
            'sessionId': checkout_session.id,
            'url': checkout_session.url
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def _crear_pedido_desde_sesion(session, user):
    """
    Crea el pedido y reduce el stock a partir de una sesión de Stripe completada.
    Devuelve el pedido creado.
    """
    meta = session['metadata']
    items = json.loads(meta.get('items', '[]'))
    cliente = Cliente.objects.get(usuario=user)

    pedido = Pedido.objects.create(
        cliente=cliente,
        direccionEntrega=meta['direccionEntrega'],
        ciudadEntrega=meta['ciudadEntrega'],
        provinciaEntrega=meta['provinciaEntrega'],
        codPostalEntrega=meta['codPostalEntrega'],
        telefono=meta.get('telefono', ''),
        pagado=True,
        stripe_session_id=session['id'],
        stripe_payment_intent=session.get('payment_intent', '')
    )

    for item in items:
        try:
            producto = Producto.objects.get(idProducto=item['id'])

            if producto.stock < item['cantidad']:
                print(f"❌ Stock insuficiente para {producto.nombre}")
                continue

            LineaPedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=item['cantidad'],
                precio_congelado=item['precio']
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
                usuario=user
            )

        except Producto.DoesNotExist:
            print(f"Producto {item['id']} no encontrado")

    return pedido


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirmar_pedido(request):
    """
    Crea el pedido después de un pago exitoso.
    Usado en desarrollo cuando el webhook no está disponible.
    """
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

        print(f"✅ Pedido #{pedido.idPedido} creado para el usuario {request.user.email}")
        return Response({'message': 'Pedido creado exitosamente', 'pedido_id': pedido.idPedido})

    except Exception as e:
        print(f"❌ Error al crear pedido: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def webhook_stripe(request):
    """
    Webhook para recibir eventos de Stripe y crear el pedido
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    
    # Manejar el evento de pago completado
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']

        try:
            user = User.objects.get(id=session['metadata']['user_id'])
            pedido = _crear_pedido_desde_sesion(session, user)
            print(f"✅ Pedido #{pedido.idPedido} creado para el usuario {user.email}")

        except Exception as e:
            print(f"❌ Error al crear pedido: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(status=status.HTTP_200_OK)
