from django.shortcuts import render
from .models import Producto, Banner, Cliente, Pedido, LineaPedido, CarritoCompra, LineaCarrito, Menu, Categoria, Coleccion, MovimientoStock
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Q
from .serializers import (
    ProductoSerializer, BannerSerializer, ClienteSerializer, 
    PedidoSerializer, LineaPedidoSerializer, CarritoCompraSerializer, LineaCarritoSerializer,
    MenusSerializer, CategoriaSerializer, ColeccionSerializer, MovimientoStockSerializer
)

# Create your views here.

def index(request):
    productos = Producto.objects.all()
    return render(request, 'backend/index.html', {'productos': productos})

class MenusViewSet(viewsets.ModelViewSet):
    # Solo mostrar menús principales (padre is null) en la lista pública
    queryset = Menu.objects.filter(padre__isnull=True).order_by('orden')
    serializer_class = MenusSerializer
    permission_classes = [AllowAny]

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]

class ColeccionViewSet(viewsets.ModelViewSet):
    queryset = Coleccion.objects.all()
    serializer_class = ColeccionSerializer
    permission_classes = [AllowAny]
    # Usar el identificador por defecto (pk) para las rutas detalle

class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('-idProducto')
    serializer_class = ProductoSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()
        categoria_id = self.request.query_params.get('categoria', None)
        
        if categoria_id:
            try:
                categoria = Categoria.objects.get(id=categoria_id)
                # Obtener la categoría seleccionada y todas sus subcategorías
                categorias_ids = [categoria.id]
                subcategorias = Categoria.objects.filter(padre=categoria)
                categorias_ids.extend([subcat.id for subcat in subcategorias])
                
                # Filtrar productos por la categoría y sus subcategorías
                queryset = queryset.filter(categoria__id__in=categorias_ids)
            except Categoria.DoesNotExist:
                queryset = queryset.filter(categoria__id=categoria_id)
        
        return queryset

    def get_serializer_context(self):
        context = super(ProductoViewSet, self).get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Si no se proporciona una nueva imagen, mantener la actual
        if 'imagen' not in request.FILES and hasattr(instance, 'imagen'):
            pass  # No actualizar el campo imagen
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def inventario(self, request):
        """
        Retorna información de inventario con stock reservado por pedidos no enviados
        """
        productos = Producto.objects.all()
        
        resultado = []
        for producto in productos:
            # Calcular stock reservado (pedidos pendientes, preparados o enviados pero no finalizados)
            stock_reservado = LineaPedido.objects.filter(
                producto=producto,
                pedido__estado__in=['pendiente', 'preparado', 'enviado']
            ).aggregate(total=Sum('cantidad'))['total'] or 0
            
            data = ProductoSerializer(producto, context={'request': request}).data
            data['stock_reservado'] = stock_reservado
            resultado.append(data)
        
        return Response(resultado)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def ajustar_stock(self, request, pk=None):
        """
        Ajusta el stock de un producto (agregar o reducir)
        """
        producto = self.get_object()
        ajuste = request.data.get('ajuste', 0)
        motivo = request.data.get('motivo', '')
        
        try:
            ajuste = int(ajuste)
        except ValueError:
            return Response(
                {'error': 'El ajuste debe ser un número'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        stock_anterior = producto.stock
        nuevo_stock = producto.stock + ajuste
        
        if nuevo_stock < 0:
            return Response(
                {'error': f'No se puede reducir el stock a un valor negativo. Stock actual: {producto.stock}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        producto.stock = nuevo_stock
        producto.save()
        
        # Registrar el movimiento de stock
        tipo = 'entrada' if ajuste > 0 else 'salida'
        MovimientoStock.objects.create(
            producto=producto,
            tipo=tipo,
            cantidad=ajuste,
            stock_anterior=stock_anterior,
            stock_nuevo=nuevo_stock,
            motivo=motivo,
            usuario=request.user
        )
        
        return Response({
            'message': 'Stock ajustado correctamente',
            'stock_anterior': stock_anterior,
            'ajuste': ajuste,
            'stock_nuevo': producto.stock,
            'motivo': motivo
        })
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def historial_movimientos(self, request, pk=None):
        """
        Obtiene el historial de movimientos de stock de un producto
        """
        producto = self.get_object()
        movimientos = MovimientoStock.objects.filter(producto=producto)
        serializer = MovimientoStockSerializer(movimientos, many=True)
        return Response(serializer.data)


class BannerViewSet(viewsets.ModelViewSet):
    queryset = Banner.objects.all().order_by('-idBanner')
    serializer_class = BannerSerializer
    permission_classes = [AllowAny]

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Si se está actualizando el email del usuario
        if 'usuario_email' in request.data:
            new_email = request.data.get('usuario_email')
            if new_email and instance.usuario:
                # Validar que el email no esté en uso por otro usuario
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if User.objects.filter(email=new_email).exclude(id=instance.usuario.id).exists():
                    return Response(
                        {'error': 'Este email ya está en uso por otro usuario'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Actualizar el email del usuario
                instance.usuario.email = new_email
                instance.usuario.save()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

class PedidoViewSet(viewsets.ModelViewSet):
    queryset = Pedido.objects.all().order_by('-idPedido')
    serializer_class = PedidoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Retorna todos los pedidos si el usuario es staff/admin,
        o solo los pedidos del usuario autenticado si no lo es
        """
        user = self.request.user
        
        # Si el usuario es staff o superusuario, retornar todos los pedidos
        if user.is_staff or user.is_superuser:
            return Pedido.objects.all().order_by('-fechaPedido')
        
        # Si no, retornar solo los pedidos del usuario
        try:
            cliente = Cliente.objects.get(usuario=user)
            return Pedido.objects.filter(cliente=cliente).order_by('-fechaPedido')
        except Cliente.DoesNotExist:
            return Pedido.objects.none()
    
    @action(detail=False, methods=['get'])
    def mis_pedidos(self, request):
        """
        Endpoint personalizado para obtener pedidos del usuario autenticado
        Siempre retorna solo los pedidos del usuario, independientemente de si es staff
        """
        user = request.user
        
        try:
            cliente = Cliente.objects.get(usuario=user)
            pedidos = Pedido.objects.filter(cliente=cliente).order_by('-fechaPedido')
        except Cliente.DoesNotExist:
            pedidos = Pedido.objects.none()
        
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)

class LineaPedidoViewSet(viewsets.ModelViewSet):
    queryset = LineaPedido.objects.all()
    serializer_class = LineaPedidoSerializer

class CarritoCompraViewSet(viewsets.ModelViewSet):
    queryset = CarritoCompra.objects.all()
    serializer_class = CarritoCompraSerializer
    permission_classes = [IsAuthenticated]

    def get_or_create_cliente(self):
        cliente, created = Cliente.objects.get_or_create(
            usuario=self.request.user,
            defaults={
                'provincia': '',
                'ciudad': '',
                'telefono': '',
                'direccion': '',
            }
        )
        return cliente

    def get_queryset(self):
        if self.request.user.is_authenticated:
            cliente = self.get_or_create_cliente()
            return CarritoCompra.objects.filter(cliente=cliente)
        return CarritoCompra.objects.none()

    def list(self, request, *args, **kwargs):
        if not self.request.user.is_authenticated:
            return Response({"detail": "Autenticación requerida."}, status=status.HTTP_401_UNAUTHORIZED)
        
        cliente = self.get_or_create_cliente()
        cart, created = CarritoCompra.objects.get_or_create(cliente=cliente)
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        if not product_id:
            return Response({"detail": "Se requiere el ID del producto."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Producto.objects.get(idProducto=product_id)
        except Producto.DoesNotExist:
            return Response({"detail": "Producto no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        
        cliente = self.get_or_create_cliente()
        cart, created = CarritoCompra.objects.get_or_create(cliente=cliente)

        linea_carrito, created = LineaCarrito.objects.get_or_create(
            carrito=cart,
            producto=product,
            defaults={'cantidad': quantity}
        )

        if not created:
            linea_carrito.cantidad += int(quantity)
            linea_carrito.save()
        
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        product_id = request.data.get('product_id')

        if not product_id:
            return Response({"detail": "Se requiere el ID del producto."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cliente = self.get_or_create_cliente()
            cart = CarritoCompra.objects.get(cliente=cliente)
            linea_carrito = LineaCarrito.objects.get(carrito=cart, producto__idProducto=product_id)
            linea_carrito.delete()
            serializer = self.get_serializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (CarritoCompra.DoesNotExist, LineaCarrito.DoesNotExist):
            return Response({"detail": "Elemento no encontrado en el carrito."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def update_quantity(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity')

        if not product_id or quantity is None:
            return Response({"detail": "Se requieren el ID del producto y la cantidad."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quantity = int(quantity)
            if quantity <= 0:
                return self.remove_item(request)
        except ValueError:
            return Response({"detail": "La cantidad debe ser un número entero."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cliente = self.get_or_create_cliente()
            cart = CarritoCompra.objects.get(cliente=cliente)
            linea_carrito = LineaCarrito.objects.get(carrito=cart, producto__idProducto=product_id)
            linea_carrito.cantidad = quantity
            linea_carrito.save()
            
            serializer = self.get_serializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except (CarritoCompra.DoesNotExist, LineaCarrito.DoesNotExist):
            return Response({"detail": "Elemento no encontrado en el carrito."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def clear_cart(self, request):
        try:
            cliente = self.get_or_create_cliente()
            cart = CarritoCompra.objects.get(cliente=cliente)
            cart.lineas.all().delete()
            serializer = self.get_serializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CarritoCompra.DoesNotExist:
            return Response({"detail": "Carrito no encontrado."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def merge_cart(self, request):
        guest_cart_items = request.data

        if not isinstance(guest_cart_items, list):
            return Response({"detail": "La respuesta tiene que ser una lista de elementos del carrito"}, status=status.HTTP_400_BAD_REQUEST)

        cliente = self.get_or_create_cliente()
        cart, created = CarritoCompra.objects.get_or_create(cliente=cliente)
        
        for item_data in guest_cart_items:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity', 1)

            if not product_id:
                continue
            
            try:
                product = Producto.objects.get(idProducto=product_id)
            except Producto.DoesNotExist:
                continue

            try:
                linea_carrito, created = LineaCarrito.objects.get_or_create(
                    carrito=cart,
                    producto=product,
                    defaults={'cantidad': int(quantity)}
                )
                if not created:
                    linea_carrito.cantidad += int(quantity)
                    linea_carrito.save()
            except ValueError:
                continue
        
        serializer = self.get_serializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LineaCarritoViewSet(viewsets.ModelViewSet):
    queryset = LineaCarrito.objects.all()
    serializer_class = LineaCarritoSerializer