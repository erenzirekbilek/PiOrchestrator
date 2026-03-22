from rest_framework import serializers
from apps.sequences.models import Sequence

from .models import Trigger


class TriggerSerializer(serializers.ModelSerializer):
    sequence = serializers.PrimaryKeyRelatedField(
        queryset=Sequence.objects.all(),
        required=False,
    )

    class Meta:
        model = Trigger
        fields = ["id", "sequence", "name", "schedule", "is_active"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if self.instance:
            return attrs
        view = self.context.get("view")
        nested = bool(view and view.kwargs.get("sequence_id") is not None)
        if not nested and not attrs.get("sequence"):
            raise serializers.ValidationError(
                {"sequence": "This field is required when not using a sequence-scoped URL."}
            )
        return attrs
