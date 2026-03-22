from django.urls import path, include
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils.timezone import now

class HealthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "ok",
            "time": now().isoformat(),
        })


class RootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "service": "PiOrchestrator API",
            "health": "/health/",
            "auth": {
                "login": "/auth/login/",
                "signup": "/auth/signup/",
                "me": "/auth/me/",
            },
            "pins": "/pins/",
            "sequences": "/sequences/",
            "triggers": "/triggers/",
            "device": "/device/",
            "device_time": "/device/time/",
            "device_command": "/device/command/",
        })


urlpatterns = [
    path("", RootView.as_view()),
    path("auth/", include("apps.auth_app.urls")),
    path("pins/", include("apps.pins.urls")),
    path("sequences/", include("apps.sequences.urls")),
    path(
        "sequences/<int:sequence_id>/triggers/",
        include("apps.triggers.urls")
    ),
    path("triggers/", include("apps.triggers.urls")),
    path("device/", include("apps.device.urls")),
    path("health/", HealthView.as_view()),
]
