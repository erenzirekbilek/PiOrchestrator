from django.apps import AppConfig


class DeviceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.device"
    label = "device"
    verbose_name = "Device App"

    def ready(self) -> None:
        try:
            from .mqtt_service import start_subscriber_thread

            start_subscriber_thread()
        except Exception:
            import logging

            logging.getLogger(__name__).exception("MQTT subscriber did not start")
