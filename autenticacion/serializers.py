from .models import User
from rest_framework import serializers, validators
from backend.models import Cliente # Import Cliente model
import uuid # For generating unique codes

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['codigoCuenta', 'fechaRegistro', 'provincia', 'ciudad', 'codigoPostal', 'telefono', 'direccion']
        read_only_fields = ['codigoCuenta', 'fechaRegistro'] # These will be set by the backend

class UserSerializer(serializers.ModelSerializer):
    cliente = ClienteSerializer(read_only=True) # Nested serializer for client details

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'cliente')

class ProfileSerializer(serializers.ModelSerializer):
    provincia = serializers.CharField(source='cliente.provincia')
    ciudad = serializers.CharField(source='cliente.ciudad')
    codigoPostal = serializers.CharField(source='cliente.codigoPostal')
    codigoPostal = serializers.CharField(source='cliente.codigoPostal', required=False, allow_blank=True)
    telefono = serializers.CharField(source='cliente.telefono')
    direccion = serializers.CharField(source='cliente.direccion')
    codigoCuenta = serializers.IntegerField(source='cliente.codigoCuenta', read_only=True)
    fechaRegistro = serializers.DateField(source='cliente.fechaRegistro', read_only=True)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'provincia', 'ciudad', 'codigoPostal', 'telefono', 'direccion', 'codigoCuenta', 'fechaRegistro')

    def update(self, instance, validated_data):
        # Actualizar campos del User
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()

        # Actualizar campos del Cliente
        cliente_data = validated_data.get('cliente', {})
        if cliente_data:
            cliente = instance.cliente
            cliente.provincia = cliente_data.get('provincia', cliente.provincia)
            cliente.codigoPostal = cliente_data.get('codigoPostal', cliente.codigoPostal)
            cliente.ciudad = cliente_data.get('ciudad', cliente.ciudad)
            cliente.telefono = cliente_data.get('telefono', cliente.telefono)
            cliente.direccion = cliente_data.get('direccion', cliente.direccion)
            cliente.save()

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    # Fields for User model
    email = serializers.EmailField(
        required=True,
        allow_blank=False,
        validators=[validators.UniqueValidator(User.objects.all(), "A user with that Email already exists.")]
    )
    password = serializers.CharField(write_only=True, required=True)
    first_name = serializers.CharField(required=True, allow_blank=False)
    last_name = serializers.CharField(required=True, allow_blank=False)

    # Fields for Cliente model (opcionales)
    provincia = serializers.CharField(write_only=True, required=True, allow_blank=False)
    ciudad = serializers.CharField(write_only=True, required=True, allow_blank=False)
    codigoPostal = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    telefono = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    direccion = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = (
            'id', 'email', 'password', 'first_name', 'last_name',
            'provincia', 'ciudad', 'codigoPostal', 'telefono', 'direccion'
        )
        extra_kwargs = {
            "password": {"write_only": True},
        }
    
    def create(self, validated_data):
        # Extract client data
        provincia = validated_data.pop('provincia', '')
        ciudad = validated_data.pop('ciudad', '')
        codigoPostal = validated_data.pop('codigoPostal', '')
        telefono = validated_data.pop('telefono', '')
        direccion = validated_data.pop('direccion', '')

        # Create the User
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )

        # Create the Cliente and link it to the User
        Cliente.objects.create(
            usuario=user,
            provincia=provincia,
            ciudad=ciudad,
            codigoPostal=codigoPostal,
            telefono=telefono,
            direccion=direccion
        )

        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden."})
        if len(attrs['new_password']) < 8:
            raise serializers.ValidationError({"password": "La contraseña debe tener al menos 8 caracteres."})
        return attrs
