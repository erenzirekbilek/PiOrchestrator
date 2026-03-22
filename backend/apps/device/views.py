from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

from .hardware import get_device_stats
from .mqtt_service import get_last_feedback, mqtt_publish, start_subscriber_thread

class DeviceStatusView(APIView):
    """
    GET: device metrics + optional MQTT publish to status topic + last feedback from MQTT.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_subscriber_thread()

        stats = get_device_stats()
        stats["timestamp"] = timezone.now().isoformat()

        mqtt_log = None
        if getattr(settings, "MQTT_ENABLED", True):
            topic = getattr(settings, "MQTT_TOPIC_STATUS", "piorchestrator/device/status")
            ok, err = mqtt_publish(topic, stats, qos=0)
            mqtt_log = "published" if ok else f"publish_failed: {err}"
        else:
            mqtt_log = "mqtt_disabled"

        stats["mqtt_log"] = mqtt_log
        stats["mqtt"] = {
            "enabled": getattr(settings, "MQTT_ENABLED", True),
            "broker": f"{getattr(settings, 'MQTT_BROKER_HOST', 'localhost')}:{getattr(settings, 'MQTT_BROKER_PORT', 1883)}",
            "status_topic": getattr(settings, "MQTT_TOPIC_STATUS", "piorchestrator/device/status"),
            "commands_topic": getattr(settings, "MQTT_TOPIC_COMMANDS", "piorchestrator/device/commands"),
            "feedback_topic": getattr(settings, "MQTT_TOPIC_FEEDBACK", "piorchestrator/device/feedback"),
        }
        fb = get_last_feedback()
        stats["last_mqtt_feedback"] = fb
        return Response(stats)


class DeviceTimeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        return Response(
            {
                "datetime": now.isoformat(),
                "timezone": str(now.tzinfo) if now.tzinfo else "UTC",
                "unix": now.timestamp(),
            }
        )


class DeviceCommandView(APIView):
    """
    POST body: {"cmd": "on"|"off"|"status", "pin": <int optional>, "value": <optional> }
    Publishes JSON to MQTT commands topic for the edge device (or mock echo).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        start_subscriber_thread()

        cmd = (request.data.get("cmd") or "").lower().strip()
        if cmd not in ("on", "off", "status", "toggle"):
            return Response(
                {"detail": "cmd must be one of: on, off, status, toggle"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pin = request.data.get("pin")
        payload = {
            "cmd": cmd,
            "pin": pin,
            "value": request.data.get("value"),
            "requested_at": timezone.now().isoformat(),
            "requested_by": request.user.username,
        }

        if getattr(settings, "MQTT_ENABLED", True):
            topic = getattr(settings, "MQTT_TOPIC_COMMANDS", "piorchestrator/device/commands")
            ok, err = mqtt_publish(topic, payload, qos=1)
            return Response(
                {
                    "ok": ok,
                    "mqtt_error": err,
                    "published": payload,
                    "topic": topic,
                },
                status=status.HTTP_200_OK if ok else status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"ok": False, "detail": "MQTT disabled", "would_publish": payload},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
