from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Pin
from .serializers import PinSerializer


class PinListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Pin.objects.all()
    serializer_class = PinSerializer


class PinReservedListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PinSerializer

    def get_queryset(self):
        return Pin.objects.filter(is_reserved=True)


class PinDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Pin.objects.all()
    serializer_class = PinSerializer
