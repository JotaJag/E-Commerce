from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductoViewSet, BannerViewSet, ClienteViewSet, PedidoViewSet, 
    LineaPedidoViewSet, CarritoCompraViewSet, LineaCarritoViewSet, MenusViewSet, CategoriaViewSet, ColeccionViewSet
)
from .stripe_views import crear_sesion_pago, webhook_stripe, confirmar_pedido


# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'banners', BannerViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'pedidos', PedidoViewSet)
router.register(r'lineas-pedido', LineaPedidoViewSet)
router.register(r'carrito-compras', CarritoCompraViewSet)
router.register(r'lineas-carrito', LineaCarritoViewSet)
router.register(r'menus', MenusViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'colecciones', ColeccionViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path('crear-sesion-pago/', crear_sesion_pago, name='crear-sesion-pago'),
    path('confirmar-pedido/', confirmar_pedido, name='confirmar-pedido'),
    path('webhook-stripe/', webhook_stripe, name='webhook-stripe'),
    path('productos', ProductoViewSet.as_view({'get': 'list'}), name='producto-list'),
    path('banners', BannerViewSet.as_view({'get': 'list'}), name='banner-list'),
    path('clientes', ClienteViewSet.as_view({'get': 'list'}), name='cliente-list'),
    path('pedidos', PedidoViewSet.as_view({'get': 'list'}), name='pedido-list'),
    path('lineas-pedido', LineaPedidoViewSet.as_view({'get': 'list'}), name='linea-pedido-list'),
    path('carrito-compras', CarritoCompraViewSet.as_view({'get': 'list'}), name='carrito-compra-list'),
    path('lineas-carrito', LineaCarritoViewSet.as_view({'get': 'list'}), name='linea-carrito-list'),
    path('menu', MenusViewSet.as_view({'get': 'list'}), name='menu-list'),
]
