from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import User
from backend.models import Cliente
from .serializers import UserSerializer, ProfileSerializer, RegisterSerializer, LoginSerializer


class UserModelTest(TestCase):
    """Tests para el modelo User personalizado"""

    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpassword123',
            'first_name': 'Test',
            'last_name': 'User'
        }

    def test_create_user(self):
        """Test crear un usuario normal"""
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name']
        )
        self.assertEqual(user.email, self.user_data['email'])
        self.assertTrue(user.check_password(self.user_data['password']))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_email(self):
        """Test crear usuario sin email debe fallar"""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email=None,
                password=self.user_data['password']
            )

    def test_create_superuser(self):
        """Test crear un superusuario"""
        superuser = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpassword123'
        )
        self.assertEqual(superuser.email, 'admin@example.com')
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        self.assertTrue(superuser.is_active)

    def test_user_string_representation(self):
        """Test la representación en string del usuario"""
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        self.assertEqual(str(user), self.user_data['email'])


class RegisterAPITest(APITestCase):
    """Tests para el endpoint de registro"""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('registro')
        self.valid_payload = {
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'first_name': 'New',
            'last_name': 'User',
            'provincia': 'Madrid',
            'ciudad': 'Madrid',
            'telefono': '666555444',
            'direccion': 'Calle Test 123'
        }

    def test_register_user_success(self):
        """Test registro exitoso de un nuevo usuario"""
        response = self.client.post(
            self.register_url,
            self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], self.valid_payload['email'])
        
        # Verificar que el usuario fue creado
        user = User.objects.get(email=self.valid_payload['email'])
        self.assertIsNotNone(user)
        
        # Verificar que el cliente fue creado
        cliente = Cliente.objects.get(usuario=user)
        self.assertEqual(cliente.provincia, self.valid_payload['provincia'])

    def test_register_user_duplicate_email(self):
        """Test registro con email duplicado debe fallar"""
        # Crear primer usuario
        self.client.post(self.register_url, self.valid_payload, format='json')
        
        # Intentar crear otro usuario con el mismo email
        response = self.client.post(
            self.register_url,
            self.valid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_user_invalid_email(self):
        """Test registro con email inválido"""
        invalid_payload = self.valid_payload.copy()
        invalid_payload['email'] = 'invalid-email'
        
        response = self.client.post(
            self.register_url,
            invalid_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_user_missing_fields(self):
        """Test registro sin campos requeridos"""
        incomplete_payload = {
            'email': 'test@example.com'
        }
        
        response = self.client.post(
            self.register_url,
            incomplete_payload,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginAPITest(APITestCase):
    """Tests para el endpoint de login"""

    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse('acceso')
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )

    def test_login_success(self):
        """Test login exitoso"""
        login_data = {
            'email': 'testuser@example.com',
            'password': 'testpassword123'
        }
        
        response = self.client.post(
            self.login_url,
            login_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], login_data['email'])

    def test_login_invalid_credentials(self):
        """Test login con credenciales incorrectas"""
        login_data = {
            'email': 'testuser@example.com',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(
            self.login_url,
            login_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    def test_login_nonexistent_user(self):
        """Test login con usuario inexistente"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        }
        
        response = self.client.post(
            self.login_url,
            login_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_missing_fields(self):
        """Test login sin campos requeridos"""
        login_data = {
            'email': 'testuser@example.com'
        }
        
        response = self.client.post(
            self.login_url,
            login_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileViewTest(APITestCase):
    """Tests para el endpoint de perfil"""

    def setUp(self):
        self.client = APIClient()
        self.profile_url = reverse('user-profile')
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666555444',
            direccion='Calle Test 123'
        )

    def test_get_profile_authenticated(self):
        """Test obtener perfil estando autenticado"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)
        self.assertEqual(response.data['provincia'], self.cliente.provincia)

    def test_get_profile_unauthenticated(self):
        """Test obtener perfil sin autenticación"""
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile(self):
        """Test actualizar perfil"""
        self.client.force_authenticate(user=self.user)
        update_data = {
            'email': 'testuser@example.com',
            'first_name': 'Updated',
            'last_name': 'Name',
            'provincia': 'Barcelona',
            'ciudad': 'Barcelona',
            'telefono': '777888999',
            'direccion': 'Nueva Dirección 456'
        }
        
        response = self.client.put(
            self.profile_url,
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.cliente.refresh_from_db()
        
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.cliente.provincia, 'Barcelona')
        self.assertEqual(self.cliente.telefono, '777888999')

    def test_partial_update_profile(self):
        """Test actualización parcial del perfil"""
        self.client.force_authenticate(user=self.user)
        update_data = {
            'first_name': 'PartialUpdate',
            'ciudad': 'Valencia'
        }
        
        response = self.client.patch(
            self.profile_url,
            update_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.cliente.refresh_from_db()
        
        self.assertEqual(self.user.first_name, 'PartialUpdate')
        self.assertEqual(self.cliente.ciudad, 'Valencia')
        # Los otros campos deben permanecer igual
        self.assertEqual(self.cliente.provincia, 'Madrid')


class UserSerializerTest(TestCase):
    """Tests para UserSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123',
            first_name='Test',
            last_name='User'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666555444',
            direccion='Calle Test 123'
        )

    def test_user_serializer_fields(self):
        """Test que UserSerializer incluye todos los campos esperados"""
        serializer = UserSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['last_name'], 'User')
        self.assertIn('id', data)
        self.assertIn('cliente', data)

    def test_user_serializer_includes_cliente(self):
        """Test que UserSerializer incluye datos del cliente anidados"""
        serializer = UserSerializer(self.user)
        data = serializer.data
        
        self.assertIsNotNone(data['cliente'])
        self.assertEqual(data['cliente']['provincia'], 'Madrid')
        self.assertEqual(data['cliente']['telefono'], '666555444')


class ProfileSerializerTest(TestCase):
    """Tests para ProfileSerializer"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='pass123',
            first_name='Test',
            last_name='User'
        )
        self.cliente = Cliente.objects.create(
            usuario=self.user,
            provincia='Madrid',
            ciudad='Madrid',
            telefono='666555444',
            direccion='Calle Test 123'
        )

    def test_profile_serializer_fields(self):
        """Test que ProfileSerializer incluye todos los campos"""
        serializer = ProfileSerializer(self.user)
        data = serializer.data
        
        self.assertEqual(data['email'], 'test@example.com')
        self.assertEqual(data['first_name'], 'Test')
        self.assertEqual(data['provincia'], 'Madrid')
        self.assertEqual(data['ciudad'], 'Madrid')
        self.assertEqual(data['telefono'], '666555444')
        self.assertEqual(data['direccion'], 'Calle Test 123')
        self.assertIn('codigoCuenta', data)
        self.assertIn('fechaRegistro', data)

    def test_profile_serializer_update(self):
        """Test actualización a través de ProfileSerializer"""
        update_data = {
            'email': 'test@example.com',
            'first_name': 'Updated',
            'last_name': 'Name',
            'provincia': 'Barcelona',
            'ciudad': 'Barcelona',
            'telefono': '777888999',
            'direccion': 'Nueva Dir'
        }
        
        serializer = ProfileSerializer(self.user, data=update_data, partial=False)
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        self.assertEqual(updated_user.first_name, 'Updated')
        self.cliente.refresh_from_db()
        self.assertEqual(self.cliente.provincia, 'Barcelona')

    def test_profile_serializer_partial_update(self):
        """Test actualización parcial"""
        update_data = {
            'first_name': 'PartialUpdate'
        }
        
        serializer = ProfileSerializer(self.user, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()
        
        self.assertEqual(updated_user.first_name, 'PartialUpdate')
        # Los otros campos deben permanecer igual
        self.assertEqual(updated_user.last_name, 'User')


class RegisterSerializerTest(TestCase):
    """Tests para RegisterSerializer"""

    def test_register_serializer_valid_data(self):
        """Test registro con datos válidos"""
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'provincia': 'Madrid',
            'ciudad': 'Madrid',
            'telefono': '666777888',
            'direccion': 'Calle Nueva 456'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        # Verificar que el usuario fue creado
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertTrue(user.check_password('newpass123'))
        
        # Verificar que el cliente fue creado
        self.assertTrue(hasattr(user, 'cliente'))
        self.assertEqual(user.cliente.provincia, 'Madrid')

    def test_register_serializer_duplicate_email(self):
        """Test que no permite emails duplicados"""
        User.objects.create_user(
            email='existing@example.com',
            password='pass123'
        )
        
        data = {
            'email': 'existing@example.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'provincia': 'Madrid',
            'ciudad': 'Madrid',
            'telefono': '666777888',
            'direccion': 'Calle Nueva'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_register_serializer_missing_required_fields(self):
        """Test validación de campos requeridos"""
        data = {
            'email': 'test@example.com',
            'password': 'pass123'
            # Faltan campos requeridos
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('first_name', serializer.errors)
        self.assertIn('last_name', serializer.errors)
        self.assertIn('provincia', serializer.errors)

    def test_register_serializer_invalid_email(self):
        """Test validación de formato de email"""
        data = {
            'email': 'invalid-email',
            'password': 'pass123',
            'first_name': 'Test',
            'last_name': 'User',
            'provincia': 'Madrid',
            'ciudad': 'Madrid',
            'telefono': '666',
            'direccion': 'Dir'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_register_serializer_password_write_only(self):
        """Test que password es write_only"""
        data = {
            'email': 'test@example.com',
            'password': 'pass123',
            'first_name': 'Test',
            'last_name': 'User',
            'provincia': 'Madrid',
            'ciudad': 'Madrid',
            'telefono': '666',
            'direccion': 'Dir'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        # Password no debe aparecer en la serialización
        output_serializer = RegisterSerializer(user)
        self.assertNotIn('password', output_serializer.data)


class LoginSerializerTest(TestCase):
    """Tests para LoginSerializer"""

    def test_login_serializer_valid_data(self):
        """Test validación con datos válidos"""
        data = {
            'email': 'test@example.com',
            'password': 'pass123'
        }
        
        serializer = LoginSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['email'], 'test@example.com')
        self.assertEqual(serializer.validated_data['password'], 'pass123')

    def test_login_serializer_missing_email(self):
        """Test validación sin email"""
        data = {
            'password': 'pass123'
        }
        
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_login_serializer_missing_password(self):
        """Test validación sin password"""
        data = {
            'email': 'test@example.com'
        }
        
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('password', serializer.errors)

    def test_login_serializer_invalid_email_format(self):
        """Test validación de formato de email"""
        data = {
            'email': 'not-an-email',
            'password': 'pass123'
        }
        
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
