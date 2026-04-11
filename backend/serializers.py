from rest_framework import serializers
from .models import Producto, Banner, Cliente, Pedido, LineaPedido, CarritoCompra, LineaCarrito, Menu, Categoria, Coleccion, MovimientoStock
from django.conf import settings

class RecursiveSerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data

class MenusSerializer(serializers.ModelSerializer):
    submenus = RecursiveSerializer(many=True, read_only=True)
    categoria_id = serializers.IntegerField(source='categoria.id', read_only=True, allow_null=True)
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True, allow_null=True)
    padre_id = serializers.IntegerField(source='padre.id', read_only=True, allow_null=True)
    padre_nombre = serializers.CharField(source='padre.nombre', read_only=True, allow_null=True)

    class Meta:
        model = Menu
        fields = ['id', 'nombre', 'url', 'categoria', 'categoria_id', 'categoria_nombre', 'padre', 'padre_id', 'padre_nombre', 'orden', 'submenus']
        extra_kwargs = {
            'categoria': {'write_only': True, 'required': False, 'allow_null': True},
            'padre': {'write_only': True, 'required': False, 'allow_null': True},
        }

class CategoriaSerializer(serializers.ModelSerializer):
    subcategorias = RecursiveSerializer(many=True, read_only=True)
    padre_id = serializers.IntegerField(source='padre.id', read_only=True, allow_null=True)
    padre_nombre = serializers.CharField(source='padre.nombre', read_only=True, allow_null=True)
    
    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'padre', 'padre_id', 'padre_nombre', 'subcategorias']
        extra_kwargs = {
            'padre': {'write_only': True, 'required': False, 'allow_null': True},
        }

class ColeccionSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Coleccion
        fields = ['id', 'nombre', 'descripcion', 'imagen', 'imagen_url']

    def get_imagen_url(self, obj):
        if obj.imagen and hasattr(obj.imagen, 'url'):
            return f"{settings.SITE_URL}{obj.imagen.url}"
        return None

class ProductoSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()
    coleccion_nombre = serializers.SerializerMethodField()
    stock = serializers.IntegerField(read_only=True)
    stock_reservado = serializers.SerializerMethodField()
    stock_disponible = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = ['idProducto', 'nombre', 'descripcion', 'precioUnitario', 'imagen', 'imagen_url', 'estado', 'marca', 'modelo', 'color', 'tipo', 'coleccion', 'coleccion_nombre', 'categoria', 'stock', 'stock_reservado', 'stock_disponible']

    def get_imagen_url(self, obj):
        if obj.imagen and hasattr(obj.imagen, 'url'):
            return f"{settings.SITE_URL}{obj.imagen.url}"
        return None

    def get_coleccion_nombre(self, obj):
        return obj.coleccion.nombre if obj.coleccion else None

    # Nota: el cálculo de stock reservado se mantiene en el modelo si se desea usar.

    def get_stock_reservado(self, obj):
        from django.db.models import Sum
        # Reservar cantidades de lineas de pedido en estados que bloquean stock
        estados_reserva = ['pendiente', 'preparado']
        reservado = obj.lineapedido_set.filter(pedido__estado__in=estados_reserva).aggregate(total=Sum('cantidad'))['total']
        return int(reservado or 0)

    def get_stock_disponible(self, obj):
        reservado = self.get_stock_reservado(obj)
        try:
            disponible = int(obj.stock or 0) - int(reservado)
        except Exception:
            disponible = 0
        return max(0, disponible)

class BannerSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = ['idBanner', 'titulo', 'descripcion', 'imagen', 'imagen_url', 'estado', 'enlace', 'orden']
        extra_kwargs = {
            'imagen': {'required': False}
        }

    def get_imagen_url(self, obj):
        if obj.imagen and hasattr(obj.imagen, 'url'):
            return f"{settings.SITE_URL}{obj.imagen.url}"
        return None

class ClienteSerializer(serializers.ModelSerializer):
    usuario_email = serializers.EmailField(source='usuario.email', read_only=False)
    usuario_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Cliente
        fields = ['usuario', 'usuario_email', 'usuario_nombre', 'codigoCuenta', 'fechaRegistro', 'provincia', 'ciudad', 'codigoPostal', 'telefono', 'direccion']
    
    def get_usuario_nombre(self, obj):
        if obj.usuario:
            nombre_completo = f"{obj.usuario.first_name} {obj.usuario.last_name}".strip()
            return nombre_completo if nombre_completo else obj.usuario.email
        return ""

class LineaPedidoSerializer(serializers.ModelSerializer):
    producto_id = serializers.CharField(source='producto.idProducto', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_imagen = serializers.SerializerMethodField()
    
    class Meta:
        model = LineaPedido
        fields = ['id', 'pedido', 'producto', 'producto_id', 'producto_nombre', 'producto_imagen', 'cantidad', 'precio_congelado', 'subtotal']
        read_only_fields = ['subtotal']
    
    def get_producto_imagen(self, obj):
        if obj.producto.imagen and hasattr(obj.producto.imagen, 'url'):
            return f"{settings.SITE_URL}{obj.producto.imagen.url}"
        return None

class PedidoSerializer(serializers.ModelSerializer):
    lineas = LineaPedidoSerializer(many=True, read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cliente_nombre = serializers.SerializerMethodField()
    cliente_email = serializers.EmailField(source='cliente.usuario.email', read_only=True)
    
    def get_cliente_nombre(self, obj):
        if obj.cliente and obj.cliente.usuario:
            nombre = obj.cliente.usuario.first_name or ''
            apellido = obj.cliente.usuario.last_name or ''
            return f"{nombre} {apellido}".strip() or obj.cliente.usuario.email
        return "Sin nombre"
    
    class Meta:
        model = Pedido
        fields = ['idPedido', 'cliente', 'cliente_nombre', 'cliente_email', 'fechaPedido', 'fechaEntrega', 'direccionEntrega', 
                  'ciudadEntrega', 'provinciaEntrega', 'codPostalEntrega', 'telefono', 
                  'descuento', 'pagado', 'estado', 'estado_display', 'lineas', 'total', 
                  'stripe_session_id', 'stripe_payment_intent']
        read_only_fields = ['total']

class LineaCarritoSerializer(serializers.ModelSerializer):
    producto = ProductoSerializer(read_only=True)
    precio_congelado = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    def get_precio_congelado(self, obj):
        return obj.producto.precioUnitario

    def get_subtotal(self, obj):
        return obj.cantidad * obj.producto.precioUnitario

    class Meta:
        model = LineaCarrito
        fields = ['id', 'producto', 'cantidad', 'precio_congelado', 'subtotal']
        read_only_fields = ['subtotal', 'producto']

class CarritoCompraSerializer(serializers.ModelSerializer):
    lineas = LineaCarritoSerializer(many=True, read_only=True)
    
    class Meta:
        model = CarritoCompra
        fields = ['idCarrito', 'cliente', 'fechaCreacion', 'lineas', 'total']
        read_only_fields = ['total']

class MovimientoStockSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    
    class Meta:
        model = MovimientoStock
        fields = ['id', 'producto', 'producto_nombre', 'tipo', 'cantidad', 
                  'stock_anterior', 'stock_nuevo', 'motivo', 'usuario', 'usuario_email', 'fecha']
        read_only_fields = ['fecha']
