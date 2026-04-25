from django.urls import path
from .views import RegisterAPI, LoginAPI, UserAPI, ProfileView, ChangePasswordAPI, PasswordResetRequestAPI, PasswordResetConfirmAPI, ContactoAPIView
from knox import views as knox_views

urlpatterns = [
    path('register/', RegisterAPI.as_view(), name='registro'),
    path('login/', LoginAPI.as_view(), name='acceso'),
    path('user/', UserAPI.as_view(), name='user'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordAPI.as_view(), name='change-password'),
    path('password-reset/', PasswordResetRequestAPI.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmAPI.as_view(), name='password_reset_confirm'),
    path('contacto/', ContactoAPIView.as_view(), name='contacto'),
    path('logout/', knox_views.LogoutView.as_view(), name='logout'),
    path('logoutall/', knox_views.LogoutAllView.as_view(), name='logoutall'),
]
