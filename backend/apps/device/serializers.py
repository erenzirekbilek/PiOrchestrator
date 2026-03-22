from rest_framework import serializers
from .models import VirtualDevice, MQTTMessage


class VirtualDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VirtualDevice
        fields = [
            "id", "name", "device_type", "bcm_pin", "is_active",
            "value", "is_digital", "mqtt_topic", "description",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "mqtt_topic", "created_at", "updated_at"]


class VirtualDeviceCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    device_type = serializers.ChoiceField(
        choices=VirtualDevice.DEVICE_TYPES,
        default="custom"
    )
    bcm_pin = serializers.IntegerField(min_value=0, max_value=40)
    is_digital = serializers.BooleanField(default=True)
    description = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_bcm_pin(self, value):
        existing = VirtualDevice.objects.filter(bcm_pin=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("This BCM pin is already assigned to another device.")
        return value


class MQTTMessageSerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source="device.name", read_only=True, allow_null=True)

    class Meta:
        model = MQTTMessage
        fields = [
            "id", "topic", "payload", "direction", "qos",
            "retained", "device", "device_name", "timestamp",
        ]
        read_only_fields = ["id", "timestamp"]
