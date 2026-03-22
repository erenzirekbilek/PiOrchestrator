from rest_framework import serializers
from .models import Pin


class PinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pin
        fields = ["id", "bcm", "name", "is_active", "is_reserved"]
        read_only_fields = ["id"]
