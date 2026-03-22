from rest_framework import serializers
from .models import Sequence


class SequenceSerializer(serializers.ModelSerializer):
    trigger_count = serializers.SerializerMethodField()

    class Meta:
        model = Sequence
        fields = [
            "id",
            "name",
            "is_active",
            "is_running",
            "length_seconds",
            "step_seconds",
            "channels",
            "last_run",
            "trigger_count",
        ]
        read_only_fields = ["id", "last_run"]

    def get_trigger_count(self, obj):
        return obj.triggers.count()

    def validate_channels(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("channels must be a list.")
        for i, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"channels[{i}] must be an object.")
            if "pin_channel" not in item or "signal_data" not in item:
                raise serializers.ValidationError(
                    f"channels[{i}] must include pin_channel and signal_data."
                )
        return value
