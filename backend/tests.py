from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from autenticacion.models import User
from .models import (
    Producto, Banner, Cliente, Pedido, LineaPedido, 
    CarritoCompra, LineaCarrito, Categoria, Menu
)
from .serializers import (
    ProductoSerializer, BannerSerializer, ClienteSerializer,
    PedidoSerializer, LineaPedidoSerializer, CarritoCompraSerializer,
    LineaCarritoSerializer, MenusSerializer
)
from decimal import Decimal
import tempfile
from PIL import Image
import io


def create_test_image():
    """Crear una imagen temporal para tests"""
    file = io.BytesIO()
    image = Image.new('RGB', (100, 100), color='red')
    image.save(file, 'png')
    file.name = 'test.png'
    file.seek(0)
    return file


class ProductoModelTest(TestCase):
    """Tests para el modelo Producto"""

    def setUp(self):
        self.categoria = Categoria.objects.create(nombre='Electrónica')
        # Usar `Categoria` con `padre` para representar subcategoría
        self.subcategoria = Categoria.objects.create(nombre='Móviles', padre=self.categoria)

    def test_create_producto(self):
        """Test crear un producto"""
        producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='iPhone 15',
            descripcion='Smartphone Apple',
            precioUnitario=Decimal('999.99'),
            categoria=self.subcategoria,
            marca='Apple',
            modelo='iPhone 15',
            color='Negro'
        )
        
        self.assertEqual(producto.nombre, 'iPhone 15')
        self.assertEqual(producto.precioUnitario, Decimal('999.99'))
        self.assertTrue(producto.estado)
        self.assertEqual(str(producto), 'iPhone 15')

    def test_producto_default_estado(self):
        """Test que el producto tiene estado True por defecto"""
        producto = Producto.objects.create(
            idProducto='PROD002',
            nombre='Test Product',
            descripcion='Test',
            precioUnitario=Decimal('10.00')
        )
        self.assertTrue(producto.estado)


class CategoriaModelTest(TestCase):
    """Tests para el modelo Categoria"""

    def test_create_categoria(self):
        """Test crear una categoría"""
        categoria = Categoria.objects.create(nombre='Deportes')
        self.assertEqual(str(categoria), 'Deportes')

    def test_subcategoria_relationship(self):
        """Test relación entre Categoría y Subcategoría"""
        categoria = Categoria.objects.create(nombre='Ropa')
        sub1 = Categoria.objects.create(nombre='Camisetas', padre=categoria)
        sub2 = Categoria.objects.create(nombre='Pantalones', padre=categoria)
        
        self.assertEqual(categoria.subcategorias.count(), 2)
        self.assertIn(sub1, categoria.subcategorias.all())


class ClienteModelTest(TestCase):
    """Tests para el modelo Cliente"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='cliente@example.com',
            password='password123'
        )

    def test_create_cliente(self):
        """Test crear un cliente"""
        cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666555444',
            direccion='Calle Test 123'
        )
        
        self.assertEqual(str(cliente), 'cliente@example.com')
        self.assertIsNotNone(cliente.codigoCuenta)
        self.assertIsNotNone(cliente.fechaRegistro)

    def test_cliente_codigo_cuenta_auto_increment(self):
        """Test que codigoCuenta se auto-incrementa"""
        user1 = User.objects.create_user(
            email='user1@example.com',
            password='pass123'
        )
        user2 = User.objects.create_user(
            email='user2@example.com',
            password='pass123'
        )
        
        cliente1 = Cliente.objects.create(
            usuario=user1,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='111',
            direccion='Dir 1'
        )
        
        cliente2 = Cliente.objects.create(
            usuario=user2,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='222',
            direccion='Dir 2'
        )
        
        self.assertEqual(cliente2.codigoCuenta, cliente1.codigoCuenta + 1)


class CarritoCompraModelTest(TestCase):
    """Tests para el modelo CarritoCompra"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666',
            direccion='Test'
        )
        self.producto1 = Producto.objects.create(
            idProducto='PROD001',
            nombre='Producto 1',
            descripcion='Desc 1',
            precioUnitario=Decimal('10.00')
        )
        self.producto2 = Producto.objects.create(
            idProducto='PROD002',
            nombre='Producto 2',
            descripcion='Desc 2',
            precioUnitario=Decimal('20.00')
        )

    def test_create_carrito(self):
        """Test crear un carrito"""
        carrito = CarritoCompra.objects.create(cliente=self.cliente)
        self.assertEqual(str(carrito), f'Carrito de {self.user.email}')

    def test_carrito_total(self):
        """Test cálculo del total del carrito"""
        carrito = CarritoCompra.objects.create(cliente=self.cliente)
        
        LineaCarrito.objects.create(
            carrito=carrito,
            producto=self.producto1,
            cantidad=2,
        )

        LineaCarrito.objects.create(
            carrito=carrito,
            producto=self.producto2,
            cantidad=1,
        )
        
        # 2 * 10 + 1 * 20 = 40
        self.assertEqual(carrito.total, Decimal('40.00'))

    def test_linea_carrito_unique_together(self):
        """Test que no se pueden duplicar productos en el mismo carrito"""
        carrito = CarritoCompra.objects.create(cliente=self.cliente)
        
        LineaCarrito.objects.create(
            carrito=carrito,
            producto=self.producto1,
            cantidad=1,
        )

        with self.assertRaises(Exception):
            LineaCarrito.objects.create(
                carrito=carrito,
                producto=self.producto1,
                cantidad=2,
            )


class PedidoModelTest(TestCase):
    """Tests para el modelo Pedido"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666',
            direccion='Test'
        )
        self.producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='Producto Test',
            descripcion='Desc',
            precioUnitario=Decimal('50.00')
        )

    def test_create_pedido(self):
        """Test crear un pedido"""
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            direccionEntrega='Calle Test 123',
            ciudadEntrega='Madrid',
            provinciaEntrega='Madrid',
            codPostalEntrega='28001'
        )
        
        self.assertIsNotNone(pedido.idPedido)
        self.assertFalse(pedido.pagado)
        self.assertEqual(pedido.descuento, Decimal('0'))

    def test_pedido_total_calculation(self):
        """Test cálculo del total del pedido"""
        pedido = Pedido.objects.create(
            cliente=self.cliente,
            direccionEntrega='Test',
            ciudadEntrega='Madrid',
            provinciaEntrega='Madrid',
            codPostalEntrega='28001',
            descuento=Decimal('5.00')
        )
        
        LineaPedido.objects.create(
            pedido=pedido,
            producto=self.producto,
            cantidad=2,
            precio_congelado=self.producto.precioUnitario
        )
        
        # 2 * 50 - 5 = 95
        self.assertEqual(pedido.total, Decimal('95.00'))


class MenuModelTest(TestCase):
    """Tests para el modelo Menu"""

    def test_create_menu(self):
        """Test crear un menú"""
        menu = Menu.objects.create(
            nombre='Inicio',
            url='/home',
            orden=1
        )
        self.assertEqual(str(menu), 'Inicio')

    def test_menu_hierarchy(self):
        """Test jerarquía de menús"""
        menu_padre = Menu.objects.create(
            nombre='Productos',
            url='/productos',
            orden=1
        )
        
        submenu1 = Menu.objects.create(
            nombre='Electrónica',
            url='/productos/electronica',
            padre=menu_padre,
            orden=1
        )
        
        submenu2 = Menu.objects.create(
            nombre='Ropa',
            url='/productos/ropa',
            padre=menu_padre,
            orden=2
        )
        
        self.assertEqual(menu_padre.submenus.count(), 2)
        self.assertIn(submenu1, menu_padre.submenus.all())


class ProductoViewSetTest(APITestCase):
    """Tests para ProductoViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='Test Product',
            descripcion='Test Description',
            precioUnitario=Decimal('99.99')
        )

    def test_list_productos(self):
        """Test listar productos"""
        url = reverse('producto-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nombre'], 'Test Product')

    def test_retrieve_producto(self):
        """Test obtener un producto específico"""
        url = reverse('producto-detail', kwargs={'pk': 'PROD001'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Test Product')


class BannerViewSetTest(APITestCase):
    """Tests para BannerViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.banner = Banner.objects.create(
            idBanner='BAN001',
            titulo='Banner Test',
            descripcion='Test Banner Description',
            estado=True
        )

    def test_list_banners(self):
        """Test listar banners"""
        url = reverse('banner-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titulo'], 'Banner Test')


class CarritoCompraViewSetTest(APITestCase):
    """Tests para CarritoCompraViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666',
            direccion='Test'
        )
        self.producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='Test Product',
            descripcion='Test',
            precioUnitario=Decimal('10.00')
        )

    def test_get_carrito_authenticated(self):
        """Test obtener carrito estando autenticado"""
        self.client.force_authenticate(user=self.user)
        url = reverse('carrito-compra-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_carrito_unauthenticated(self):
        """Test obtener carrito sin autenticación"""
        url = reverse('carrito-compra-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_carrito_created_for_new_user(self):
        """Test que se crea un carrito automáticamente para usuario nuevo"""
        self.client.force_authenticate(user=self.user)
        url = reverse('carrito-compra-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verificar que se creó el carrito
        carrito = CarritoCompra.objects.filter(cliente=self.cliente).first()
        self.assertIsNotNone(carrito)


class MenusViewSetTest(APITestCase):
    """Tests para MenusViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.menu_padre = Menu.objects.create(
            nombre='Productos',
            url='/productos',
            orden=1
        )
        self.submenu = Menu.objects.create(
            nombre='Electrónica',
            url='/productos/electronica',
            padre=self.menu_padre,
            orden=1
        )

    def test_list_menus(self):
        """Test listar menús principales"""
        url = reverse('menu-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Solo debe devolver menús principales (sin padre)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nombre'], 'Productos')
        # Verificar que incluye submenus
        self.assertIn('submenus', response.data[0])
        self.assertEqual(len(response.data[0]['submenus']), 1)


class ProductoSerializerTest(TestCase):
    """Tests para ProductoSerializer"""

    def setUp(self):
        self.categoria = Categoria.objects.create(nombre='Electrónica')
        self.producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='iPhone 15',
            descripcion='Smartphone Apple',
            precioUnitario=Decimal('999.99'),
            marca='Apple',
            categoria=self.categoria
        )

    def test_producto_serializer_contains_expected_fields(self):
        """Test que el serializer contiene todos los campos esperados"""
        serializer = ProductoSerializer(self.producto)
        data = serializer.data
        
        self.assertEqual(set(data.keys()), {
            'idProducto', 'nombre', 'descripcion', 'precioUnitario',
            'imagen', 'imagen_url', 'estado', 'marca', 'modelo',
            'color', 'tipo', 'coleccion', 'coleccion_nombre', 'categoria',
            'stock', 'stock_reservado', 'stock_disponible',
            'descuento', 'descuento_efectivo', 'precio_con_descuento'
        })

    def test_producto_serializer_field_content(self):
        """Test contenido de los campos serializados"""
        serializer = ProductoSerializer(self.producto)
        data = serializer.data
        
        self.assertEqual(data['idProducto'], 'PROD001')
        self.assertEqual(data['nombre'], 'iPhone 15')
        self.assertEqual(float(data['precioUnitario']), 999.99)
        self.assertEqual(data['marca'], 'Apple')
        self.assertTrue(data['estado'])


class BannerSerializerTest(TestCase):
    """Tests para BannerSerializer"""

    def setUp(self):
        self.banner = Banner.objects.create(
            idBanner='BAN001',
            titulo='Oferta Especial',
            descripcion='Descuentos increíbles',
            estado=True,
            enlace='https://example.com'
        )

    def test_banner_serializer_fields(self):
        """Test campos del serializer"""
        serializer = BannerSerializer(self.banner)
        data = serializer.data
        
        self.assertEqual(data['idBanner'], 'BAN001')
        self.assertEqual(data['titulo'], 'Oferta Especial')
        self.assertEqual(data['enlace'], 'https://example.com')
        self.assertTrue(data['estado'])


class LineaPedidoSerializerTest(TestCase):
    """Tests para LineaPedidoSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666',
            direccion='Test'
        )
        self.producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='Test Product',
            descripcion='Test',
            precioUnitario=Decimal('50.00')
        )
        self.pedido = Pedido.objects.create(
            cliente=self.cliente,
            direccionEntrega='Test',
            ciudadEntrega='Madrid',
            provinciaEntrega='Madrid',
            codPostalEntrega='28001'
        )
        self.linea = LineaPedido.objects.create(
            pedido=self.pedido,
            producto=self.producto,
            cantidad=2,
            precio_congelado=Decimal('50.00')
        )

    def test_linea_pedido_serializer_subtotal_read_only(self):
        """Test que subtotal es read_only"""
        serializer = LineaPedidoSerializer(self.linea)
        data = serializer.data
        
        self.assertIn('subtotal', data)
        self.assertEqual(float(data['subtotal']), 100.00)
        
        # Verificar que subtotal es read_only
        self.assertIn('subtotal', LineaPedidoSerializer.Meta.read_only_fields)

    def test_linea_pedido_serializer_fields(self):
        """Test campos del serializer"""
        serializer = LineaPedidoSerializer(self.linea)
        data = serializer.data
        
        self.assertEqual(data['cantidad'], 2)
        self.assertEqual(float(data['precio_congelado']), 50.00)
        self.assertIn('producto', data)


class PedidoSerializerTest(TestCase):
    """Tests para PedidoSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666',
            direccion='Test'
        )
        self.producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='Test Product',
            descripcion='Test',
            precioUnitario=Decimal('50.00')
        )
        self.pedido = Pedido.objects.create(
            cliente=self.cliente,
            direccionEntrega='Calle Test 123',
            ciudadEntrega='Madrid',
            provinciaEntrega='Madrid',
            codPostalEntrega='28001',
            descuento=Decimal('10.00')
        )
        LineaPedido.objects.create(
            pedido=self.pedido,
            producto=self.producto,
            cantidad=2,
            precio_congelado=Decimal('50.00')
        )

    def test_pedido_serializer_includes_lineas(self):
        """Test que incluye líneas de pedido"""
        serializer = PedidoSerializer(self.pedido)
        data = serializer.data
        
        self.assertIn('lineas', data)
        self.assertEqual(len(data['lineas']), 1)

    def test_pedido_serializer_total_calculation(self):
        """Test cálculo del total"""
        serializer = PedidoSerializer(self.pedido)
        data = serializer.data
        
        self.assertIn('total', data)
        # 2 * 50 - 10 = 90
        self.assertEqual(float(data['total']), 90.00)
        
        # Verificar que total es read_only
        self.assertIn('total', PedidoSerializer.Meta.read_only_fields)


class LineaCarritoSerializerTest(TestCase):
    """Tests para LineaCarritoSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666',
            direccion='Test'
        )
        self.carrito = CarritoCompra.objects.create(cliente=self.cliente)
        self.producto = Producto.objects.create(
            idProducto='PROD001',
            nombre='Test Product',
            descripcion='Test',
            precioUnitario=Decimal('25.00')
        )
        self.linea = LineaCarrito.objects.create(
            carrito=self.carrito,
            producto=self.producto,
            cantidad=3,
        )

    def test_linea_carrito_serializer_includes_producto(self):
        """Test que incluye datos del producto"""
        serializer = LineaCarritoSerializer(self.linea)
        data = serializer.data
        
        self.assertIn('producto', data)
        self.assertEqual(data['producto']['nombre'], 'Test Product')
        
        # Verificar que producto es read_only
        self.assertIn('producto', LineaCarritoSerializer.Meta.read_only_fields)

    def test_linea_carrito_serializer_subtotal(self):
        """Test cálculo de subtotal"""
        serializer = LineaCarritoSerializer(self.linea)
        data = serializer.data
        
        self.assertIn('subtotal', data)
        # 3 * 25 = 75
        self.assertEqual(float(data['subtotal']), 75.00)


class CarritoCompraSerializerTest(TestCase):
    """Tests para CarritoCompraSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666',
            direccion='Test'
        )
        self.carrito = CarritoCompra.objects.create(cliente=self.cliente)
        self.producto1 = Producto.objects.create(
            idProducto='PROD001',
            nombre='Product 1',
            descripcion='Test',
            precioUnitario=Decimal('10.00')
        )
        self.producto2 = Producto.objects.create(
            idProducto='PROD002',
            nombre='Product 2',
            descripcion='Test',
            precioUnitario=Decimal('20.00')
        )
        LineaCarrito.objects.create(
            carrito=self.carrito,
            producto=self.producto1,
            cantidad=2,
        )
        LineaCarrito.objects.create(
            carrito=self.carrito,
            producto=self.producto2,
            cantidad=1,
        )

    def test_carrito_serializer_includes_lineas(self):
        """Test que incluye líneas del carrito"""
        serializer = CarritoCompraSerializer(self.carrito)
        data = serializer.data
        
        self.assertIn('lineas', data)
        self.assertEqual(len(data['lineas']), 2)

    def test_carrito_serializer_total_calculation(self):
        """Test cálculo del total del carrito"""
        serializer = CarritoCompraSerializer(self.carrito)
        data = serializer.data
        
        self.assertIn('total', data)
        # 2*10 + 1*20 = 40
        self.assertEqual(float(data['total']), 40.00)
        
        # Verificar que total es read_only
        self.assertIn('total', CarritoCompraSerializer.Meta.read_only_fields)


class MenusSerializerTest(TestCase):
    """Tests para MenusSerializer (recursivo)"""

    def setUp(self):
        self.menu_padre = Menu.objects.create(
            nombre='Productos',
            url='/productos',
            orden=1
        )
        self.submenu1 = Menu.objects.create(
            nombre='Electrónica',
            url='/productos/electronica',
            padre=self.menu_padre,
            orden=1
        )
        self.submenu2 = Menu.objects.create(
            nombre='Ropa',
            url='/productos/ropa',
            padre=self.menu_padre,
            orden=2
        )
        self.subsubmenu = Menu.objects.create(
            nombre='Camisetas',
            url='/productos/ropa/camisetas',
            padre=self.submenu2,
            orden=1
        )

    def test_menus_serializer_recursive(self):
        """Test serialización recursiva de menús"""
        serializer = MenusSerializer(self.menu_padre)
        data = serializer.data
        
        self.assertEqual(data['nombre'], 'Productos')
        self.assertIn('submenus', data)
        self.assertEqual(len(data['submenus']), 2)

    def test_menus_serializer_deep_nesting(self):
        """Test anidamiento profundo de menús"""
        serializer = MenusSerializer(self.menu_padre)
        data = serializer.data
        
        # Verificar submenu
        submenu_ropa = next(s for s in data['submenus'] if s['nombre'] == 'Ropa')
        self.assertIn('submenus', submenu_ropa)
        self.assertEqual(len(submenu_ropa['submenus']), 1)
        
        # Verificar subsubmenu
        self.assertEqual(submenu_ropa['submenus'][0]['nombre'], 'Camisetas')

    def test_menus_serializer_fields(self):
        """Test campos del serializer"""
        serializer = MenusSerializer(self.menu_padre)
        data = serializer.data
        
        self.assertIn('id', data)
        self.assertIn('nombre', data)
        self.assertIn('url', data)
        self.assertIn('submenus', data)
