from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Sequence
from .serializers import SequenceSerializer


class SequenceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Sequence.objects.all()
    serializer_class = SequenceSerializer


class SequenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Sequence.objects.all()
    serializer_class = SequenceSerializer


class SequenceRunView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        seq = get_object_or_404(Sequence, pk=pk)
        seq.is_running = True
        seq.last_run = timezone.now()
        seq.save()
        return Response(
            {
                "ok": True,
                "is_running": seq.is_running,
                "last_run": seq.last_run,
                "id": seq.id,
            }
        )


class SequenceStopView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        seq = get_object_or_404(Sequence, pk=pk)
        seq.is_running = False
        seq.save()
        return Response(
            {
                "ok": True,
                "is_running": seq.is_running,
                "id": seq.id,
            }
        )


class SequenceCopyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        seq = get_object_or_404(Sequence, pk=pk)
        dup = Sequence.objects.create(
            name=f"{seq.name} (copy)",
            is_active=False,
            is_running=False,
            length_seconds=seq.length_seconds,
            step_seconds=seq.step_seconds,
            channels=list(seq.channels) if seq.channels else [],
        )
        return Response(SequenceSerializer(dup).data, status=status.HTTP_201_CREATED)
