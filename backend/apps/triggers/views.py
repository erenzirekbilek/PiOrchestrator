from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Trigger
from .serializers import TriggerSerializer


class TriggerListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TriggerSerializer

    def get_queryset(self):
        sid = self.kwargs.get("sequence_id")
        if sid is not None:
            return Trigger.objects.filter(sequence_id=sid)
        return Trigger.objects.all()

    def perform_create(self, serializer):
        sid = self.kwargs.get("sequence_id")
        if sid is not None:
            serializer.save(sequence_id=sid)
        else:
            serializer.save()
