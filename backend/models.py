from django.db import models
from django.conf import settings
from django.db.models import Max

class Producto(models.Model):
    idProducto = models.CharField(max_length=100, primary_key=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    precioUnitario = models.DecimalField(max_digits=10, decimal_places=2)
    imagen = models.ImageField(upload_to='productos/')
    estado = models.BooleanField(default=True)
    stock = models.PositiveIntegerField(default=0)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    categoria = models.ForeignKey('Categoria', on_delete=models.SET_NULL, null=True, blank=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    coleccion = models.ForeignKey('Coleccion', on_delete=models.SET_NULL, null=True, blank=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    tipo = models.CharField(max_length=50, blank=True, null=True)

    @property
    def descuento_efectivo(self):
        if self.descuento and self.descuento > 0:
            return self.descuento
        if self.coleccion and self.coleccion.descuento > 0:
            return self.coleccion.descuento
        return 0

    @property
    def precio_con_descuento(self):
        from decimal import Decimal
        d = self.descuento_efectivo
        if d > 0:
            return round(self.precioUnitario * (1 - d / Decimal('100')), 2)
        return self.precioUnitario

    class Meta:
        db_table = 'producto'

    def __str__(self):
        return self.nombre

class MovimientoStock(models.Model):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('ajuste', 'Ajuste'),
        ('venta', 'Venta'),
    ]
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()  # Positivo para entrada, negativo para salida
    stock_anterior = models.IntegerField()
    stock_nuevo = models.IntegerField()
    motivo = models.TextField()
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'movimientostock'
        ordering = ['-fecha']
    
    def __str__(self):
        return f"{self.tipo} - {self.producto.nombre} ({self.cantidad})"

class Categoria(models.Model):
    nombre = models.CharField(max_length=100)
    padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategorias')

    class Meta:
        db_table = 'categoria'

    def __str__(self):
        return self.nombre

class Coleccion(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='colecciones/')
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        db_table = 'coleccion'
        verbose_name_plural = 'Colecciones'

    def __str__(self):
        return self.nombre


class Banner(models.Model):
    idBanner = models.CharField(max_length=100, primary_key=True)
    titulo = models.CharField(max_length=100)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='productos/')
    estado = models.BooleanField(default=True)
    enlace = models.CharField(max_length=255, blank=True, null=True)
    orden = models.IntegerField(default=0)

    class Meta:
        db_table = 'banner'

    def __str__(self):
        return self.titulo

class Cliente(models.Model):
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cliente')
    codigoCuenta = models.IntegerField(null=True, blank=True, unique=True) 
    fechaRegistro = models.DateField(auto_now_add=True)
    provincia = models.CharField(max_length=100, blank=True, default='')
    ciudad = models.CharField(max_length=100, blank=True, default='')
    codigoPostal = models.CharField(max_length=10, blank=True, default='')
    telefono = models.CharField(max_length=15, blank=True, default='')
    direccion = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        db_table = 'cliente'

    def __str__(self):
        return self.usuario.email

    def save(self, *args, **kwargs):
        if not self.codigoCuenta:
            last_codigo = Cliente.objects.aggregate(max_codigo=Max('codigoCuenta'))['max_codigo']
            self.codigoCuenta = (last_codigo or 0) + 1
        super().save(*args, **kwargs)

class Pedido(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('preparado', 'Preparado'),
        ('enviado', 'Enviado'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]
    
    idPedido = models.AutoField(primary_key=True)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='pedidos')
    fechaPedido = models.DateField(auto_now_add=True)
    fechaEntrega = models.DateField(null=True, blank=True)
    direccionEntrega = models.CharField(max_length=255)
    ciudadEntrega = models.CharField(max_length=100)
    provinciaEntrega = models.CharField(max_length=100)
    codPostalEntrega = models.CharField(max_length=10)
    telefono = models.CharField(max_length=15, blank=True, default='')
    descuento = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    porcentaje_iva = models.DecimalField(max_digits=5, decimal_places=2, default=21)
    pagado = models.BooleanField(default=False)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    stripe_session_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_payment_intent = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'pedido'
        ordering = ['-fechaPedido']

    def __str__(self):
        return f"Pedido #{self.idPedido} de {self.cliente.usuario.email}"

    @property
    def subtotal_bruto(self):
        return sum(linea.subtotal for linea in self.lineas.all())

    @property
    def total(self):
        return self.subtotal_bruto - self.descuento

    @property
    def base_imponible(self):
        from decimal import Decimal
        divisor = 1 + self.porcentaje_iva / Decimal('100')
        return round(self.total / divisor, 2)

    @property
    def cuota_iva(self):
        return round(self.total - self.base_imponible, 2)

class LineaPedido(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='lineas')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)
    precio_congelado = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'lineapedido'

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"

    @property
    def subtotal(self):
        return self.cantidad * self.precio_congelado

class CarritoCompra(models.Model):
    idCarrito = models.AutoField(primary_key=True)
    cliente = models.OneToOneField(Cliente, on_delete=models.CASCADE, related_name='carrito')
    fechaCreacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'carritocompra'

    def __str__(self):
        return f"Carrito de {self.cliente.usuario.email}"

    @property
    def total(self):
        return sum(linea.subtotal for linea in self.lineas.all())

class LineaCarrito(models.Model):
    carrito = models.ForeignKey(CarritoCompra, on_delete=models.CASCADE, related_name='lineas')
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'lineacarrito'
        unique_together = ('carrito', 'producto')

    def __str__(self):
        return f"{self.cantidad} x {self.producto.nombre}"

    @property
    def subtotal(self):
        return self.cantidad * self.producto.precioUnitario
    
class Menu(models.Model):
    nombre = models.CharField(max_length=100)
    url = models.CharField(max_length=100)
    padre = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.SET_NULL, 
        related_name='submenus'
    )
    categoria = models.ForeignKey(
        Categoria,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='menus'
    )
    orden = models.IntegerField(default=0)

    class Meta:
        db_table = 'menu'
        ordering = ['orden']

    def __str__(self):
        return self.nombre