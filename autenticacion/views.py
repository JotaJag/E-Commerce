from rest_framework import generics, permissions, status
from rest_framework.response import Response
from knox.models import AuthToken
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, ProfileSerializer
from django.contrib.auth import login, authenticate

class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": AuthToken.objects.create(user)[1]
        })

class LoginAPI(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return Response({
                "user": UserSerializer(user, context=self.get_serializer_context()).data,
                "token": AuthToken.objects.create(user)[1]
            })
        else:
            return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(generics.RetrieveUpdateAPIView):
    
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserAPI(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class ChangePasswordAPI(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not current_password or not new_password or not confirm_password:
            return Response(
                {"error": "Todos los campos son requeridos"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {"error": "La contraseña actual es incorrecta"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != confirm_password:
            return Response(
                {"error": "Las contraseñas nuevas no coinciden"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 8:
            return Response(
                {"error": "La contraseña debe tener al menos 8 caracteres"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Contraseña cambiada exitosamente"},
            status=status.HTTP_200_OK
        )

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
from .models import User

class PasswordResetRequestAPI(generics.GenericAPIView):
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"message": "Si el correo está registrado, recibirás un enlace."}, status=status.HTTP_200_OK)

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        reset_url = f"{settings.FRONTEND_URL}/restablecer-password/{uidb64}/{token}"
        
        send_mail(
            subject='Recuperación de contraseña',
            message=f'Hola,\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n\n{reset_url}\n\nSi no solicitaste este cambio, puedes ignorar este correo.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        return Response({"message": "Si el correo está registrado, recibirás un enlace."}, status=status.HTTP_200_OK)

class PasswordResetConfirmAPI(generics.GenericAPIView):
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uidb64 = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"message": "Contraseña restablecida correctamente."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "El enlace no es válido o ha expirado."}, status=status.HTTP_400_BAD_REQUEST)

class ContactoAPIView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        nombre = request.data.get('nombre')
        email = request.data.get('email')
        asunto = request.data.get('asunto')
        mensaje = request.data.get('mensaje')

        if not all([nombre, email, asunto, mensaje]):
            return Response({'error': 'Todos los campos son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            send_mail(
                subject=f'Nuevo mensaje de contacto: {asunto}',
                message=f'Nombre: {nombre}\nEmail: {email}\nAsunto: {asunto}\n\nMensaje:\n{mensaje}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.EMAIL_HOST_USER],
                fail_silently=False,
            )

            send_mail(
                subject='Hemos recibido tu mensaje - TypeVibe86',
                message=f'Hola {nombre},\n\nHemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible.\n\nTu mensaje:\n{mensaje}\n\nSaludos,\nEl equipo de TypeVibe86',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

            return Response({'message': 'Mensaje enviado exitosamente, en breve nos pondremos en contacto contigo.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Hubo un error al enviar el mensaje.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)