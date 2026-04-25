# E-Commerce — Trabajo de Fin de Grado (DAW)

Aplicación de comercio electrónico full-stack desarrollada como Trabajo de Fin de Grado del Ciclo Superior de Desarrollo de Aplicaciones Web. Incluye catálogo de productos, carrito de compra, pasarela de pago con Stripe, gestión de pedidos, autenticación de usuarios, envío de notificaciones por e-mail y panel de administración.

---

## Tecnologías utilizadas

### Backend
| Tecnología | Versión |
|---|---|
| Python | 3.12 |
| Django | última versión |
| Django REST Framework | última versión |
| Django-Knox (autenticación) | última versión |
| PostgreSQL | 17 |
| Stripe | última versión |
| Pillow | última versión |
| django-cors-headers | última versión |
| Django Jazzmin (admin) | última versión |
| python-dotenv | última versión |
| pytest + pytest-django | última versión |
| coverage | 7.4.0 |

### Frontend
| Tecnología | Versión |
|---|---|
| React | 19.2.0 |
| Vite | 7.2.4 |
| React Router DOM | 6.22.3 |
| Stripe.js SDK | 3.0.6 |
| Vitest | 4.1.5 |

---

## Funcionalidades principales

- Registro e inicio de sesión con autenticación por token (Knox)
- Modelo de usuario personalizado basado en email (sin nombre de usuario)
- Catálogo de productos con categorías jerárquicas y colecciones
- Filtrado de productos por categoría, incluyendo subcategorías automáticamente
- Descuentos por producto y por colección, con herencia automática si el producto no tiene descuento propio
- Carrito de compra persistente con fusión de carrito de invitado al iniciar sesión
- Pago integrado con **Stripe Checkout** con IVA (21%) desglosado en la sesión de pago
- Pedidos con desglose fiscal completo (base imponible, cuota IVA, total)
- Gestión de pedidos con ciclo de vida completo (pendiente → preparado → enviado → finalizado/cancelado)
- Control de stock con historial de movimientos
- Recuperación de contraseña por email con enlace seguro de un solo uso
- Formulario de contacto con confirmación por email al usuario y notificación al administrador
- Panel de administración personalizado con Django Jazzmin
- Gestión de banners, menú de navegación, clientes y pedidos desde el admin

---

## Estructura del proyecto

```
E-Commerce/
├── backend/            # App Django principal (productos, pedidos, carrito, pagos)
├── autenticacion/      # App Django de autenticación y perfiles
├── core/               # Configuración del proyecto Django
├── frontend/           # Aplicación React + Vite
│   ├── src/
│   │   ├── components/ # Componentes reutilizables
│   │   ├── context/    # Contextos (Auth, Carrito)
│   │   ├── utils/      # Utilidades y helpers
│   │   └── test/       # Tests del frontend
├── media/              # Archivos subidos (imágenes de productos)
├── templates/          # Plantillas Django
├── manage.py
├── requirements.txt
└── docker-compose.yml
```

---

## Requisitos previos

- [Docker](https://www.docker.com/) y Docker Compose  
  **o bien**
- Python 3.12 y Node.js 20 (para desarrollo local sin Docker)

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd E-Commerce
```

### 2. Configurar las variables de entorno

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Django
DEBUG=1
SECRET_KEY=tu-clave-secreta-aqui
ALLOWED_HOSTS=localhost,127.0.0.1
SITE_URL=http://localhost:8000

# Base de datos
POSTGRES_DB=EComerceDB
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu-password
DB_HOST=db
DB_PORT=5432

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=http://localhost:5173/pago-exitoso
STRIPE_CANCEL_URL=http://localhost:5173/pago

# Frontend
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

---

### Opción A — Con Docker (recomendado)

```bash
# Levantar todos los servicios (base de datos, backend, frontend)
docker-compose up

# En otra terminal, aplicar migraciones
docker-compose exec backend python manage.py migrate

# (Opcional) Crear superusuario para el panel de administración
docker-compose exec backend python manage.py createsuperuser
```

### Opción B — Desarrollo local sin Docker

**Backend:**
```bash
# Crear entorno virtual
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser   # opcional
python manage.py runserver
```

**Frontend** (en otra terminal):
```bash
cd frontend
npm install
npm run dev
```

---

## URLs de acceso

| Servicio | URL |
|---|---|
| Frontend (tienda) | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Panel de administración | http://localhost:8000/admin |

---

## Principales endpoints de la API

### Autenticación

La API usa **Django Knox** para la gestión de tokens. Al hacer login o registro se devuelve un token que debe enviarse en la cabecera de todas las peticiones protegidas:

```
Authorization: Token <token>
```

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register/` | Registro de usuario (devuelve token) |
| `POST` | `/api/auth/login/` | Inicio de sesión (devuelve token) |
| `GET` | `/api/auth/user/` | Datos del usuario autenticado |
| `GET/PUT/PATCH` | `/api/auth/profile/` | Perfil del cliente |
| `POST` | `/api/auth/change-password/` | Cambio de contraseña |
| `POST` | `/api/auth/password-reset/` | Solicitar restablecimiento de contraseña |
| `POST` | `/api/auth/password-reset-confirm/` | Confirmar nueva contraseña |
| `POST` | `/api/auth/contacto/` | Formulario de contacto |
| `POST` | `/api/auth/logout/` | Cerrar sesión (invalida el token actual) |
| `POST` | `/api/auth/logoutall/` | Cerrar todas las sesiones (invalida todos los tokens) |

### Catálogo (públicos)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/productos/` | Listado de productos |
| `GET` | `/api/productos/<id>/` | Detalle de producto |
| `GET` | `/api/categorias/` | Categorías (con subcategorías anidadas) |
| `GET` | `/api/colecciones/` | Colecciones |
| `GET` | `/api/banners/` | Banners promocionales |
| `GET` | `/api/menus/` | Menú de navegación (con submenús anidados) |

### Carrito y pedidos (requieren autenticación)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET/POST` | `/api/carrito-compras/` | Ver o modificar carrito |
| `GET` | `/api/pedidos/` | Historial de pedidos |
| `POST` | `/api/crear-sesion-pago/` | Crear sesión de pago Stripe |
| `POST` | `/api/confirmar-pedido/` | Confirmar pedido tras pago exitoso (fallback sin webhook) |

### Stripe (sin autenticación de usuario)
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/webhook-stripe/` | Webhook llamado por Stripe al completar el pago |

---

## Flujo de pago

1. El usuario añade productos al carrito
2. Inicia el proceso de pago → se crea una sesión en Stripe
3. El usuario es redirigido a la página de pago de Stripe
4. Tras el pago exitoso, Stripe notifica via webhook
5. El pedido se confirma, el stock se descuenta y el usuario es redirigido a la página de confirmación

---

## Tests

### Backend (Django + pytest)

```bash
# Ejecutar todos los tests
pytest

# Solo una app
pytest autenticacion/
pytest backend/

# Con cobertura
coverage run -m pytest
coverage report
coverage html   # genera reporte en htmlcov/
```

### Con Docker

```bash
# Backend
docker-compose --profile test up backend-test

# Frontend
docker-compose --profile test up frontend-test

# Ambos a la vez
docker-compose --profile test up

# Scripts de conveniencia
./run_tests.sh          # Linux/Mac
.\run_tests.ps1         # Windows PowerShell
.\run_tests.ps1 -Coverage -App backend   # con opciones
```

### Frontend (Vitest)

```bash
cd frontend
npm run test       # modo watch
npm run test:run   # ejecución única
```

---

## Autor

**Jose Alcaraz Garcia**  
Ciclo Superior de Desarrollo de Aplicaciones Web (DAW)  
Trabajo de Fin de Grado — 2025/2026
