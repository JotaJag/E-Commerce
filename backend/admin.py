from django.contrib import admin
from django import forms
from .models import Producto, Cliente, Pedido, LineaPedido, CarritoCompra, LineaCarrito, Banner, Menu, Categoria, Coleccion, MovimientoStock

class ProductoAdminForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Crear opciones jerárquicas para categorías
        categorias_choices = [('', '---------')]
        categorias_padre = Categoria.objects.filter(padre__isnull=True).order_by('nombre')
        
        for cat_padre in categorias_padre:
            categorias_choices.append((cat_padre.id, cat_padre.nombre))
            subcategorias = Categoria.objects.filter(padre=cat_padre).order_by('nombre')
            for subcat in subcategorias:
                categorias_choices.append((subcat.id, f'→ {subcat.nombre}'))
        
        self.fields['categoria'].widget.choices = categorias_choices

class ProductoAdmin(admin.ModelAdmin):
    form = ProductoAdminForm
    list_display = ('nombre', 'precioUnitario', 'estado', 'categoria', 'marca', 'modelo')
    list_filter = ('estado', 'marca')
    search_fields = ('nombre', 'descripcion', 'marca', 'modelo')

class BannerAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'estado', 'enlace')
    list_filter = ('estado',)
    search_fields = ('titulo', 'descripcion')

class ClienteAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'codigoCuenta', 'fechaRegistro', 'provincia', 'ciudad')
    search_fields = ('usuario__username', 'codigoCuenta')

class PedidoAdmin(admin.ModelAdmin):
    list_display = ('idPedido', 'cliente', 'fechaPedido', 'fechaEntrega', 'total', 'pagado')
    list_filter = ('pagado', 'fechaPedido')
    search_fields = ('cliente__usuario__username', 'idPedido')

class LineaPedidoAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'producto', 'cantidad', 'precio_congelado', 'subtotal')
    search_fields = ('pedido__idPedido', 'producto__nombre')

class CarritoCompraAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'fechaCreacion')
    search_fields = ('cliente__usuario__username',)

class LineaCarritoAdmin(admin.ModelAdmin):
    list_display = ('carrito', 'producto', 'cantidad', 'subtotal')
    search_fields = ('carrito__cliente__usuario__username', 'producto__nombre')

class MenuAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'url', 'get_categoria_display', 'padre', 'orden')
    list_filter = ('padre',)
    search_fields = ('nombre', 'url')
    
    def get_categoria_display(self, obj):
        if obj.categoria:
            if obj.categoria.padre:
                return f"{obj.categoria.padre.nombre} → {obj.categoria.nombre}"
            return obj.categoria.nombre
        return "-"
    get_categoria_display.short_description = 'Categoría'

class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'get_padre_display')
    search_fields = ('nombre',)
    list_filter = ('padre',)
    
    def get_padre_display(self, obj):
        return obj.padre.nombre if obj.padre else "Categoría Principal"
    get_padre_display.short_description = 'Tipo'

class ColeccionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)


class MovimientoStockAdmin(admin.ModelAdmin):
    list_display = ('producto', 'tipo', 'cantidad', 'stock_anterior', 'stock_nuevo', 'usuario', 'fecha')
    list_filter = ('tipo', 'fecha')
    search_fields = ('producto__nombre', 'motivo', 'usuario__email')
    readonly_fields = ('fecha',)

# Register your models here.

admin.site.register(Producto, ProductoAdmin)
admin.site.register(Categoria, CategoriaAdmin)
admin.site.register(Coleccion, ColeccionAdmin)
admin.site.register(Banner, BannerAdmin)
admin.site.register(Cliente, ClienteAdmin)
admin.site.register(Pedido, PedidoAdmin)
admin.site.register(LineaPedido, LineaPedidoAdmin)
admin.site.register(CarritoCompra, CarritoCompraAdmin)
admin.site.register(LineaCarrito, LineaCarritoAdmin)
admin.site.register(Menu, MenuAdmin)
admin.site.register(MovimientoStock, MovimientoStockAdmin)

# Personalizar títulos del admin (aparecen en la pestaña del navegador)
admin.site.site_header = 'Typevibe86'
admin.site.site_title = 'Typevibe86'