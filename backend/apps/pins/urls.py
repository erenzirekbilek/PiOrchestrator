from django.urls import path

from .views import PinDetailView, PinListCreateView, PinReservedListView

urlpatterns = [
    path("reserved/", PinReservedListView.as_view()),
    path("<int:pk>/", PinDetailView.as_view()),
    path("", PinListCreateView.as_view()),
]
