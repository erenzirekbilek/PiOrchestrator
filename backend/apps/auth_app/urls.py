from django.urls import path
from .views import LoginView, SignupView, MeView

urlpatterns = [
    path("login/", LoginView.as_view()),
    path("signup/", SignupView.as_view()),
    path("me/", MeView.as_view()),
]
