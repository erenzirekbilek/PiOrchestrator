from django.db import models


class VirtualDevice(models.Model):
    DEVICE_TYPES = [
        ("valve", "Valve"),
        ("light", "Light"),
        ("pump", "Pump"),
        ("fan", "Fan"),
        ("heater", "Heater"),
        ("sensor", "Sensor"),
        ("custom", "Custom"),
    ]

    name = models.CharField(max_length=255)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPES, default="custom")
    bcm_pin = models.PositiveIntegerField(help_text="BCM GPIO pin number")
    is_active = models.BooleanField(default=False)
    value = models.IntegerField(default=0, help_text="Current value (0-100 for PWM, 0/1 for digital)")
    is_digital = models.BooleanField(default=True, help_text="True=digital on/off, False=PWM analog")
    mqtt_topic = models.CharField(max_length=255, blank=True, help_text="Auto-generated if empty")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["bcm_pin"]

    def __str__(self):
        return f"{self.name} (BCM {self.bcm_pin})"

    def save(self, *args, **kwargs):
        if not self.mqtt_topic:
            safe_name = self.name.lower().replace(" ", "_").replace("-", "_")
            self.mqtt_topic = f"piorchestrator/device/{safe_name}/state"
        super().save(*args, **kwargs)


class MQTTMessage(models.Model):
    DIRECTION_CHOICES = [
        ("pub", "Published"),
        ("sub", "Received"),
    ]

    topic = models.CharField(max_length=512, db_index=True)
    payload = models.TextField()
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    qos = models.IntegerField(default=0)
    retained = models.BooleanField(default=False)
    device = models.ForeignKey(
        VirtualDevice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mqtt_messages",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "MQTT Message"
        verbose_name_plural = "MQTT Messages"

    def __str__(self):
        return f"{self.direction.upper()} [{self.topic}]: {self.payload[:50]}"
